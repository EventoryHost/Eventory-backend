import MakeupArtist from "../../models2/makeupArtist.js";
import { Vendor } from "../../models2/vendor.js";
import { MakeupArtistModel } from "../../models2/reduxModels/makeupArtist.js";
import generateUniqueId from "../../utils/generateId2.js";
import parseRange from "../../utils/parseRange.js";

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
  if (!section || typeof section !== "object") return false;

  let isComplete = true;

  for (const key of Object.keys(section)) {
    const value = section[key];
    const isFilled = Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && value !== "";

    if (!isFilled) {
      console.warn(
        `❌ Incomplete field: ${key}, Value: ${JSON.stringify(value)}`
      );
      isComplete = false;
    } else {
      console.log(`✅ Filled field: ${key}`);
    }
  }

  return isComplete;
};
const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', 'yes', '1'].includes(s)) return true;
    if (['false', 'no', '0'].includes(s)) return false;
  }
  return undefined;
};

const splitCSV = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x)).map(s => s.trim()).filter(Boolean);
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
};

const parseArrayLike = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  } catch {
    return [String(v)];
  }
};

const updateSectionCompletion = async (id) => {
  try {
    const makeupArtist = await MakeupArtist.findOne({ vendor_id: id });
    if (!makeupArtist) throw new Error("Makeup artist not found");

    makeupArtist.basic_details.is_completed = checkCompletion(
      makeupArtist.basic_details
    );

    makeupArtist.service_details.is_completed = checkCompletion(
      makeupArtist.service_details
    );

    makeupArtist.additional_details.is_completed = checkCompletion(
      makeupArtist.additional_details
    );

    makeupArtist.policies.is_completed = checkCompletion(makeupArtist.policies);

    makeupArtist.business_details.is_completed = checkCompletion(
      makeupArtist.business_details
    );

    await makeupArtist.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
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

const createMakeupArtist = async (req, res) => {
  try {

    // Normalize incoming payload
    const vendor_id = req.body.vendor_id || req.body.id || req.body.venId;
    const serviceType = req.body.service_type || req.body.serviceTypeBusiness || "Makeup-Artist";

    // Basic details
    const point_of_contact = req.body.point_of_contact || req.body.pointOfContact;
    const service_contact_number = req.body.service_contact_number || req.body.serviceContactNumber;
    const min_booking_capacity = req.body.min_booking_capacity ?? req.body.minBookingCapacity;
    const max_booking_capacity = req.body.max_booking_capacity ?? req.body.maxBookingCapacity;
    const description = req.body.description;

    // Location (service)
    const service_address = req.body.service_address || req.body.address;
    const lat = req.body.lat || req.body.latitude;
    const lon = req.body.lon || req.body.longitude;
    const service_pincode = req.body.service_pincode ?? req.body.servicePincode;
    const google_map_link = req.body.google_map_link || req.body.googleMapLink || req.body.location?.google_maps_address || "";

    // Arrays
    const service_areas = req.body.service_areas || splitCSV(req.body.serviceAreas);
    const event_types_makeup = req.body.event_types_makeup || splitCSV(req.body.eventTypes);
    const types_of_makeup_artists_available = req.body.types_of_makeup_artists_available || splitCSV(req.body.typesOfMakeupArtists);
    const service_types = req.body.service_types || splitCSV(req.body.serviceTypes);

    // Booleans
    const is_onsite_makeup_available = (req.body.is_onsite_makeup_available !== undefined)
      ? toBool(req.body.is_onsite_makeup_available) : toBool(req.body.onsiteMakeup);
    const is_customization_possible = (req.body.is_customization_possible !== undefined)
      ? toBool(req.body.is_customization_possible) : toBool(req.body.customization);

    // Media
    const asset_images = req.body.asset_images || parseArrayLike(req.body.photos);
    const asset_videos = req.body.asset_videos || parseArrayLike(req.body.videos);

    // Socials + pricing + booking period
    const ig_socials_link = req.body.ig_socials_link || req.body.socialMedia || "";
    const web_social_link = req.body.web_social_link || req.body.websiteUrl || "";
    const prices_starts_from = req.body.prices_starts_from ?? req.body.priceStarts;
    const min_booking_period = req.body.min_booking_period ?? req.body.minBookingPeriod;
    const max_booking_period = req.body.max_booking_period ?? req.body.maxBookingPeriod;

    // Policies
    const terms_and_conditions = req.body.terms_and_conditions || parseArrayLike(req.body.termsAndConditions)[0] || "";
    const cancellation_policy = req.body.cancellation_policy || parseArrayLike(req.body.cancellationPolicy)[0] || "";

    // Business details
    const category = req.body.category;
    const business_registration_name = req.body.business_registration_name || req.body.businessRegistrationName;
    const gst = req.body.gst;
    const pan = req.body.pan ?? null;
    const verification_type = req.body.verification_type || req.body.verificationType;
    const team_size = req.body.team_size ?? req.body.teamSize;
    const years_of_operation = req.body.years_of_operation ?? req.body.yearsOfOperation;
    const business_address = req.body.business_address || req.body.businessAddress;
    const landmark = req.body.landmark;
    const business_pincode = req.body.pincode ?? req.body.businessPincode;
    const operational_cities = req.body.operational_cities || splitCSV(req.body.operationalCities);
    const annual_revenue = req.body.annual_revenue || req.body.annualRevenue;
    const annual_bookings = req.body.annual_bookings ?? req.body.annualBookings;

    // Check if artist already exists
    const alreadyExists = await MakeupArtist.findOne({
      vendor_id: vendor_id,
    });

    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    const service_id = generateUniqueId("MKA");

    // Find temporary makeup data
    const tempMakeupData = await MakeupArtistModel.findOne({
      vendor_id: vendor_id,
    });

    const agreementUrl = tempMakeupData?.agreement_url || " ";
    const agreementSignedAt = tempMakeupData?.agreement_signed_at || new Date();

    if (agreementUrl) {
      console.log("Found agreement data for venue:", agreementUrl);
    }

    // Determine profile completion
    const fieldsToCheck = [
      // basic_details fields
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.min_booking_capacity,
      req.body.max_booking_capacity,
      req.body.description,
      req.body.event_types_makeup?.length > 0,
      req.body.types_of_makeup_artists_available?.length > 0,
      req.body.service_location_make_up?.lat,
      req.body.service_location_make_up?.lon,
      req.body.service_location_make_up?.service_pincode,
      req.body.service_location_make_up?.google_map_link,

      // service_details fields
      req.body.is_onsite_makeup_available,
      req.body.is_customization_possible,
      req.body.service_types?.length > 0,

      // additional_details fields
      asset_images.length > 0,
      asset_videos.length > 0,
      req.body.min_booking_period,
      req.body.max_booking_period,
      req.body.prices_starts_from,
      req.body.ig_socials_link, // ✅ matches schema
      req.body.web_social_link, // ✅ matches schema

      // policies fields
      req.body.cancellation_policy, // ✅ snake_case
      req.body.terms_and_conditions, // ✅ snake_case

      // business_details fields
      req.body.category,
      req.body.business_registration_name,
      req.body.gst,
      req.body.pan,
      req.body.verification_type,
      req.body.team_size,
      req.body.years_of_operation,
      req.body.business_address,
      req.body.landmark,
      req.body.pincode,
      req.body.operational_cities,
      req.body.annual_revenue,
      req.body.annual_bookings,
    ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profile_completion_score =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;
   
    // Construct the new document
    const newMakeupArtist = new MakeupArtist({
      vendor_id: vendor_id,
      service_type: req.body.service_type || "Makeup-Artist",
      service_areas: service_areas || [],
      service_id: service_id,
      // ... (nested objects populated from req.body)
      basic_details: {
        is_completed: profile_completion_score?.basic_details || false,
        point_of_contact,
        service_contact_number,
        min_booking_capacity,
        max_booking_capacity,
        description,
        event_types_makeup,
        types_of_makeup_artists_available,
        service_location_make_up: {
          service_address,
          lat,
          lon,
          service_pincode: service_pincode,
          google_map_link,
        },

      },
      service_details: {
        is_completed: profile_completion_score?.service_details || false,
        is_onsite_makeup_available,
        is_customization_possible,
        service_types,
      },
      additional_details: {
        is_completed: profile_completion_score?.additional_details || false,
        asset_images,
        asset_videos,
        min_booking_period,
        max_booking_period,
        prices_starts_from,
        ig_socials_link,
        web_social_link,
      },
      policies: {
        is_completed: profile_completion_score?.policies || false,
        cancellation_policy,
        terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      },
      business_details: {
        is_completed: profile_completion_score?.business_details || false,
        service_id: service_id,
        service_type: serviceType,
        category,
        business_registration_name,
        gst,
        pan,
        verification_type,
        team_size,
        years_of_operation,
        business_address,
        landmark,
        pincode: business_pincode,
        operational_cities,
        annual_revenue,
        annual_bookings,
      },
      bank_details: {
        bank_name: req.body.bank_name,
        account_type: req.body.account_type,
        account_number: req.body.account_number,
        ifsc: req.body.ifsc,
        service_id: service_id,
        vendor_id: vendor_id,
      },
      profile_completion_score: profile_completion_score || 0,
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    // Use the normalized label already determined earlier
    const serviceTypeLabel = serviceType || "Makeup-Artist";
    const normalizedLabel = normalizeServiceName(serviceTypeLabel);

    // Associate with vendor
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      await MakeupArtist.findByIdAndDelete(savedMakeupArtist._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!Array.isArray(vendor.services)) vendor.services = [];
    if (!vendor.services.includes(savedMakeupArtist.service_id)) {
      vendor.services.push(savedMakeupArtist.service_id);
    }

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
      service_id: savedMakeupArtist.service_id,
    };

    if (idx >= 0) {
      vendor.service_types[idx] = { ...vendor.service_types[idx], ...updatedEntry };
    } else {
      vendor.service_types.push(updatedEntry);
    }

    await vendor.save();
  
    await updateSectionCompletion(savedMakeupArtist.vendor_id);

    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedMakeupArtist.basic_details.point_of_contact,
        type: savedMakeupArtist.service_type,
      });

    console.log("Request completed successfully.");
    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    console.error("An error occurred in createMakeupArtist:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(400).json({ error: error.message });
  }
};

const getAllMakeupArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;

    const makeupArtists =
      page == -1
        ? await MakeupArtist.find()
        : await MakeupArtist.find().skip(skip).limit(itemsPerPage);

    const totalMakeupArtists = await MakeupArtist.countDocuments();

    res.status(200).json({
      data: makeupArtists,
      currentPage: page,
      totalPages: Math.ceil(totalMakeupArtists / itemsPerPage),
      totalItems: totalMakeupArtists,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getMakeupArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const makeupArtist = await MakeupArtist.findOne({ service_id: id });

    if (!makeupArtist) {
      return res.status(404).json({ message: "Makeup artist not found" });
    }
    res.status(200).json(makeupArtist);
  } catch (error) {
    console.error("Error fetching makeup artist:", error);
    res.status(400).json({ message: error.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist, getMakeupArtistById };
