import VenueProvider from "../../models2/venueProvider.js";
import { Vendor } from "../../models2/vendor.js";
import { Caterer } from "../../models2/caterer.js";
// import { Decorator } from "../../models2/decoraters.js";
// import Photographer from "../../models2/photographers.js";
// import PropRental from "../../models2/props.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../../controllers2/sesController.js";
import { ReduxVenueProviderModel } from "../../models2/reduxModels/venueProvider.js";
import generateUniqueId from "../../utils/generateId2.js";

const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const checkCompletion = (section) => {
    if (!section || typeof section !== "object") return false; // Validate input
  
    return Object.keys(section).every((key) => {
      const value = section[key];
  
      // Check if the value is an array and not empty
      if (Array.isArray(value)) {
        return value.length > 0;
      }
  
      // Check if the value is non-empty for other types
      return value !== undefined && value !== null && value !== "";
    });
  };

const updateSectionCompletion = async (venId) => {
  try {
    const venue = await VenueProvider.findOne({
      vendor_id: venId,
    });

    if (!venue) {
      throw new Error("Venue not found");
    }

    venue.basic_details.is_completed = checkCompletion(venue.basic_details || {});
    venue.feature_details.is_completed = checkCompletion(
      venue.feature_details || {}
    );
    venue.additional_details.is_completed = checkCompletion(
      venue.additional_details || {}
    );
    venue.policies.is_completed = checkCompletion(venue.policies || {});

    await venue.save();
  } catch (error) {
    console.error("Error in update section:", error);
    throw error;
  }
};

const normalizeServiceName = (label) => {
  if (!label) return label;
  const s = String(label).trim().toLowerCase();
  if (["venue provider", "venue-provider", "venueprovider"].includes(s)) return "Venue Provider";
  if (["makeup-artist", "makeup artist", "makeupartist"].includes(s)) return "Makeup-Artist";
  if (["caterer"].includes(s)) return "Caterer";
  if (["decorator"].includes(s)) return "Decorator";
  if (["photographer & videographer", "photographer and videographer", "pav"].includes(s)) return "Photographer & Videographer";
  return label;
};

const createVenue = async (req, res) => {
  try {
    // Check if the venue already exists for the given vendor ID
    if (!req.body.service_type && req.body.service_type_business) {
      req.body.service_type = req.body.service_type_business;
    }

    const alreadyExists = await VenueProvider.findOne({
      vendor_id: req.body.vendor_id,
      point_of_contact: req.body.point_of_contact,
    });
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "Venue already exists for this vendor" });
    } // Extract file URLs from the request

    const service_id = generateUniqueId("VNP");
    const termsAndConditionsFileUrl = req.body.policies?.terms_and_conditions;
    const cancellationPolicyFileUrl = req.body.policies?.cancellation_policy;
    const insurancePolicyFileUrl = req.body.policies?.insurance_policy;
    const asset_images = req.body.additional_details?.asset_images || [];
    const asset_videos = req.body.additional_details?.asset_videos || []; // Fetch agreement data from temporary venue collection

    const tempVenueData = await ReduxVenueProviderModel.findOne({
      vendor_id: req.body.vendor_id,
    });
    const agreementUrl = tempVenueData?.agreement_url || null;
    const agreementSignedAt = tempVenueData?.agreement_signed_at || null;

    if (agreementUrl) {
      console.log("Found agreement data for venue:", agreementUrl);
    }

    const fieldsToCheck = [
        req.body.business_name,
        req.body.business_email,
        req.body.business_contact_number,
        req.body.business_address,
        req.body.business_description,
        req.body.pan_number,
        req.body.category,
        req.body.service_type,
        req.body.business_registration_name,
        req.body.gst,
        req.body.verification_type,
        req.body.team_size,
        req.body.years_of_operation,
        req.body.annual_revenue,
        req.body.annual_bookings,
        req.body.pincode,
        req.body.bank_name,
        req.body.account_type,
        req.body.account_number,
        req.body.ifsc,
        req.body.service_id,
        req.body.vendor_id,
        req.body.point_of_contact,
        req.body.service_contact_number,
        req.body.description,
        req.body.min_booking_capacity,
        req.body.max_booking_capacity,
        req.body.venue_name,
        req.body.service_type_details?.length > 0,
        req.body.event_types_venue?.length > 0,
        req.body.lat,
        req.body.lon,
        req.body.service_opening_time,
        req.body.service_closing_time,
        req.body.service_pincode,
        req.body.google_map_link,
        req.body.in_house_catering,
        req.body.in_house_decoration,
        req.body.venue_types_available?.length > 0,
        req.body.av_eqp_available_at_venue?.length > 0,
        req.body.accessibility_features_of_venue?.length > 0,
        req.body.restriction_policies_on_venue?.length > 0,
        req.body.special_features_in_venue?.length > 0,
        req.body.fascilities_at_venue?.length > 0,
        req.body.asset_images?.length > 0,
        req.body.asset_videos?.length > 0,
        req.body.min_booking_period,
        req.body.max_booking_period,
        req.body.prices_starts_from,
        req.body.ig_socials_link,
        req.body.web_social_link,
        req.body.cancellation_policy,
        req.body.terms_and_conditions,
      ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profile_completion_score =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;
    const newVenue = new VenueProvider({
      vendor_id: req.body.vendor_id,
      service_type: req.body.service_type || "Venue-Provider",
      service_areas: req.body.service_areas || [],
      service_id: service_id,

      // Business Details
      business_details: {
        business_name: req.body.business_name,
        business_email: req.body.business_email,
        business_contact_number: req.body.business_contact_number,
        business_address: req.body.business_address,
        business_description: req.body.business_description,
        pan: req.body.pan,
        category: req.body.category,
        service_type: req.body.service_type || "Venue-Provider",
        business_registration_name: req.body.business_registration_name,
        gst: req.body.gst,
        verification_type: req.body.verification_type,
        team_size: req.body.team_size,
        years_of_operation: req.body.years_of_operation,
        annual_revenue: req.body.annual_revenue,
        annual_bookings: req.body.annual_bookings,
        landmark: req.body.landmark || "",
        pincode: req.body.pincode,
        service_id: service_id,
        operational_cities: req.body.operational_cities || [],
      },

      // Bank Details
      bank_details: {
        bank_name: req.body.bank_name,
        account_type: req.body.account_type,
        account_number: req.body.account_number,
        ifsc: req.body.ifsc,
        service_id: service_id,
        vendor_id: req.body.vendor_id,
      },

      // Basic Details
      basic_details: {
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        description: req.body.description,
        min_booking_capacity: req.body.min_booking_capacity,
        max_booking_capacity: req.body.max_booking_capacity,
        venue_name: req.body.venue_name,
        service_type_details: req.body.service_type_details || [],
        event_types_venue: req.body.event_types_venue || [],
        service_location_venue: {
          service_address: req.body.address, 
          lat: req.body.lat,
          lon: req.body.lon,
          service_opening_time: req.body.service_opening_time,
          service_closing_time: req.body.service_closing_time,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        },
      },

      // Feature Details
      feature_details: {
        in_house_catering: req.body.in_house_catering,
        in_house_decoration: req.body.in_house_decoration,
        venue_types_available: req.body.venue_types_available || [],
        av_eqp_available_at_venue: req.body.av_eqp_available_at_venue || [],
        accessibility_features_of_venue:
          req.body.accessibility_features_of_venue || [],
        restriction_policies_on_venue:
          req.body.restriction_policies_on_venue || [],
        special_features_in_venue: req.body.special_features_in_venue || [],
        fascilities_at_venue: req.body.fascilities_at_venue || [],
      },

      // Additional Details
      additional_details: {
        asset_images: req.body.asset_images || [],
        asset_videos: req.body.asset_videos || [],
        min_booking_period: req.body.min_booking_period,
        max_booking_period: req.body.max_booking_period,
        prices_starts_from: req.body.prices_starts_from,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
      },

      // Policies
      policies: {
        cancellation_policy: req.body.cancellation_policy,
        terms_and_conditions: req.body.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      },
      profile_completion_score: 0,
    }); // Calculate profile completion

    newVenue.profile_completion_score = profile_completion_score;

    const savedVenue = await newVenue.save(); // Link the venue to the vendor (user)

    // Associate with vendor
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await VenueProvider.findByIdAndDelete(savedVenue._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Use the normalized label already determined earlier
    const serviceTypeLabel = req.body.service_type || "Venue Provider";
    const normalizedLabel = normalizeServiceName(serviceTypeLabel);

    // 1) Make sure vendor.services contains the service_id once
    if (!Array.isArray(vendor.services)) vendor.services = [];
    if (!vendor.services.includes(savedVenue.service_id)) {
      vendor.services.push(savedVenue.service_id);
    }

    // 2) Update existing service_types element by service_name (case-insensitive)
    if (!Array.isArray(vendor.service_types)) vendor.service_types = [];

    const idx = vendor.service_types.findIndex(
      (st) =>
        st &&
        typeof st.service_name === "string" &&
        st.service_name.toLowerCase() === normalizedLabel.toLowerCase()
    );

    const updatedEntry = {
      service_name: normalizedLabel,
      service_status: "Inactive",
      service_id: savedVenue.service_id,
    };

    if (idx >= 0) {
      vendor.service_types[idx] = { ...vendor.service_types[idx], ...updatedEntry };
    } else {
      vendor.service_types.push(updatedEntry);
    }

    await vendor.save();
    
    // Update section completion and profile completion
    await updateSectionCompletion(savedVenue.vendor_id);
    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedVenue.basic_details.venue_name,
        type: savedVenue.service_type,
      });

    res.status(201).json(savedVenue);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const getAllVenues = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const venues =
      page == -1
        ? await VenueProvider.find()
        : await VenueProvider.find().skip(skip).limit(itemsPerPage);

    const totalvenues = await VenueProvider.countDocuments();
    console.log("data is ", venues);
    res.status(200).json({
      data: venues,
      currentPage: page,
      totalPages: Math.ceil(totalvenues / itemsPerPage),
      totalItems: totalvenues,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getVenueImages = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await VenueProvider.findOne({ id: id }).lean();

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    return res.status(200).json(venue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVenueVideos = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await VenueProvider.findOne({ venId: id }).lean();
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const videos = venue.videos || [];
    return res.status(200).json(videos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addReviews = async (req, res) => {
  try {
    const { date, feedback, id, name, photos, rating, type } = req.body;
    if (!id || !name || !rating || !feedback || !type || !Date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (type === "venue") {
      const venue = await VenueProvider.findOne({ id: id });
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      if (!venue.reviews) {
        venue.reviews = [];
      }
      venue.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await venue.save();
      res.status(200).json(venue);
    } else if (type === "caterer") {
      const caterer = await Caterer.findOne({ id: id });
      if (!caterer) {
        return res.status(404).json({ message: "Caterer not found" });
      }
      if (!caterer.reviews) {
        caterer.reviews = [];
      }
      caterer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await caterer.save();
      res.status(200).json(caterer);
    } else if (type === "decorator") {
      const decorator = await Decorator.findOne({ id: id });
      if (!decorator) {
        return res.status(404).json({ message: "Decorator not found" });
      }
      if (!decorator.reviews) {
        decorator.reviews = [];
      }
      decorator.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await decorator.save();
      res.status(200).json(decorator);
    } else if (type === "photographer") {
      const photographer = await Photographer.findOne({ id: id });
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      if (!photographer.reviews) {
        photographer.reviews = [];
      }
      photographer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await photographer.save();
      res.status(200).json(photographer);
    } else if (type === "propRental") {
      const prop = await PropRental.findOne({ id: id });
      if (!prop) {
        return res.status(404).json({ message: "Prop Rental not found" });
      }
      if (!prop.reviews) {
        prop.reviews = [];
      }
      prop.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await prop.save();
      res.status(200).json(prop);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVenueReviews = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await VenueProvider.findOne({ id: id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.status(200).json(venue.reviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calculate completion before fetching
    const { checkVenueProfileCompletion } = await import("../../utils/completionUtils/venueCompletionUtils.js");
    try {
      await checkVenueProfileCompletion(id);
    } catch (completionError) {
      console.warn("Error calculating venue completion:", completionError);
      // Continue even if completion calculation fails
    }
    
    const venue = await VenueProvider.findOne({ service_id: id });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(400).json({ message: error.message });
  }
};

export default { createVenue, getAllVenues, getVenueById };
