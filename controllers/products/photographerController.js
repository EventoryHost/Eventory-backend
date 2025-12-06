import PhotographerVideographer from "../../models/photographerVideographer.js";
import { ReduxPhotographerVideographerModel } from "../../models/reduxModels/photographerVideographer.js";
import { Vendor } from "../../models/vendor.js";
import generateUniqueId from "../../utils/generateId2.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";

const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

// utils/normalizeMedia.js
export function normalizePhotos(input) {
  // Always returns [{ original, preview }]
  if (!input) return [];

  // If FormData sent JSON string
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizePhotos(parsed);
      } catch {
        // CSV of URLs fallback
        return trimmed.split(",")
          .map(s => s.trim()).filter(Boolean)
          .map(u => ({ original: u, preview: u }));
      }
    }
    // Single URL string
    return [{ original: input, preview: input }];
  }

  // If already an array
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (!item) return null;

      // Plain URL string
      if (typeof item === "string") return { original: item, preview: item };

      // If original/preview are incorrectly json-stringified arrays, unwrap first entry
      const safe = (v) => {
        if (typeof v === "string" && v.trim().startsWith("[")) {
          try {
            const arr = JSON.parse(v);
            const first = Array.isArray(arr) ? arr[0] : arr;
            return first?.original || first?.preview || "";
          } catch { return v; }
        }
        return v;
      };

      const original = safe(item.original) || safe(item.url) || "";
      const preview = safe(item.preview) || original;
      return original ? { original, preview } : null;
    }).filter(Boolean);
  }

  // If weird shape (e.g., object with 0,1,2 keys from bracket fields), try to flatten known patterns
  return [];
}

export function normalizeVideos(input) {
  if (!input) return [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return normalizeVideos(parsed);
    } catch {
      return input.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(input)) {
    return input.map(v => String(v)).filter(Boolean);
  }
  return [];
}

// Helper function to check if a section is complete
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

// Update section completion for a photographer
const updateSectionCompletion = async (id) => {
  try {
    console.log(`Starting updateSectionCompletion for vendor ID: ${id}`);

    const photographer = await PhotographerVideographer.findOne({
      vendor_id: id,
    });

    if (!photographer) {
      console.log(
        `Photographer not found for vendor ID: ${id}. Throwing error.`
      );
      throw new Error("Photographer not found");
    }

    console.log(
      `Found photographer with vendor ID: ${id}. Starting completion check.`
    );

    // Update completion status for each section - FIX: Use correct property names
    if (photographer.basic_details) {
      console.log("Checking basic_details completion...");
      photographer.basic_details.is_completed = checkCompletion(
        photographer.basic_details || {}
      );
      console.log(
        `basic_details completion status: ${photographer.basic_details.completed}`
      );
    }

    if (photographer.service_details) {
      console.log("Checking service_details completion...");
      photographer.service_details.is_completed = checkCompletion(
        photographer.service_details || {}
      );
      console.log(
        `service_details completion status: ${photographer.service_details.completed}`
      );
    }

    if (photographer.additional_details) {
      console.log("Checking additional_details completion...");
      photographer.additional_details.is_completed = checkCompletion(
        photographer.additional_details || {}
      );
      console.log(
        `additional_details completion status: ${photographer.additional_details.completed}`
      );
    }

    if (photographer.policies) {
      console.log("Checking policies completion...");
      photographer.policies.is_completed = checkCompletion(
        photographer.policies || {}
      );
      console.log(
        `policies completion status: ${photographer.policies.completed}`
      );
    }

    await photographer.save();
    console.log(`Successfully saved photographer data for vendor ID: ${id}.`);
  } catch (error) {
    console.error("Error in updateSectionCompletion:", error);
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

const createPhotographer = async (req, res) => {
  try {
    const service_id = generateUniqueId("PAV");
    const alreadyExists = await PhotographerVideographer.findOne({
      vendor_id: req.body.vendor_id,
    });
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "Photographer already exists for this vendor" });
    }

    // Prepare fields from the request body
    const {
      // Basic Details
      point_of_contact,
      service_contact_number,
      description,
      event_types_captured,
      send_proposals_to_clients,
      do_initial_customer_consultation,
      do_destination_events,
      do_advance_setup,
      do_post_production_services,
      service_lat,
      service_lon,
      service_pincode,
      google_map_link,

      // Service Details
      type_of_service,
      types_of_equipment_available,
      types_of_styles_offered,
      add_ons_upgrade_available,
      final_delivery_methods,
      service_offering_type,
      delivery_timeline,

      // Additional Details
      asset_images,
      asset_videos,
      min_booking_period,
      max_booking_period,
      prices_starts_from,
      ig_socials_link,
      web_social_link,

      // Policies
      cancellation_policy,
      terms_and_conditions,
    } = req.body;

    // Normalize media
    const images = normalizePhotos(asset_images);     // [{ original, preview }]
    const videos = normalizeVideos(asset_videos);     // string[]

    // Optional: guard
    if (!images.length) return res.status(400).json({ message: "At least one photo is required" });
    if (!videos.length) return res.status(400).json({ message: "At least one video is required" });

    // Agreement from redux temp
    const tempPAVData = await ReduxPhotographerVideographerModel.findOne({ vendor_id: req.body.vendor_id });
    const agreement_url = tempPAVData?.agreement_url || " ";
    const agreement_signed_at = tempPAVData?.agreement_signed_at || new Date();

    //check if the above fields are null
    if (agreement_url || agreement_signed_at) {
      console.log("Found agreement data for photographer:", agreement_url);
      console.log(
        "Found agreement data for photographer:",
        agreement_signed_at
      );
    }

    // Create new PhotographerVideographer document
    const newPAV = new PhotographerVideographer({
      vendor_id: req.body.vendor_id,
      service_type: "Photographer-Videographer",
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
        service_type: req.body.service_type,
        business_registration_name: req.body.business_registration_name,
        gst: req.body.gst,
        verification_type: req.body.verification_type,
        team_size: req.body.team_size,
        years_of_operation: req.body.years_of_operation,
        annual_revenue: req.body.annual_revenue,
        landmark: req.body.landmark,
        operational_cities: req.body.operational_cities || [],
        annual_bookings: req.body.annual_bookings,
        pincode: req.body.pincode,
        service_id: service_id,
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

      basic_details: {
        point_of_contact,
        service_contact_number,
        description,
        event_types_captured,
        send_proposals_to_clients,
        do_initial_customer_consultation,
        do_destination_events,
        do_advance_setup,
        do_post_production_services,
        service_location_pav: {
          service_address: req.body.address,
          lat: service_lat,
          lon: service_lon,
          service_pincode,
          google_map_link,
        },
      },
      service_details: {
        type_of_service,
        types_of_equipment_available,
        types_of_styles_offered,
        add_ons_upgrade_available,
        final_delivery_methods,
        service_offering_type,
        delivery_timeline,
      },
      additional_details: {
        asset_images: images,          // [{ original, preview }]
        asset_videos: videos,          // [string]
        min_booking_period,
        max_booking_period,
        prices_starts_from,
        ig_socials_link,
        web_social_link,
      },

      policies: {
        cancellation_policy,
        terms_and_conditions,
        agreement_url,
        agreement_signed_at,
      },
      profile_completion_score: 0,
      is_active: true,
    });

    // Calculate profile completion
    const fieldsToCheck = [
      newPAV.basic_details.point_of_contact,
      newPAV.basic_details.service_contact_number,
      newPAV.basic_details.description,
      newPAV.basic_details.event_types_captured?.length > 0,
      newPAV.basic_details.send_proposals_to_clients,
      newPAV.basic_details.do_initial_customer_consultation,
      newPAV.basic_details.do_destination_events,
      newPAV.basic_details.do_advance_setup,
      newPAV.basic_details.do_post_production_services,
      newPAV.basic_details.service_location_pav.lat,
      newPAV.basic_details.service_location_pav.lon,
      newPAV.basic_details.service_location_pav.service_pincode,
      newPAV.basic_details.service_location_pav.google_map_link,
      newPAV.service_details.type_of_service,
      newPAV.service_details.types_of_equipment_available?.length > 0,
      newPAV.service_details.types_of_styles_offered?.length > 0,
      newPAV.service_details.final_delivery_methods?.length > 0,
      newPAV.service_details.service_offering_type,
      newPAV.service_details.delivery_timeline,
      newPAV.additional_details.asset_images?.length > 0,
      newPAV.additional_details.asset_videos?.length > 0,
      newPAV.additional_details.min_booking_period,
      newPAV.additional_details.max_booking_period,
      newPAV.additional_details.prices_starts_from,
      newPAV.additional_details.ig_socials_link,
      newPAV.additional_details.web_social_link,
      newPAV.policies.cancellation_policy,
      newPAV.policies.terms_and_conditions,
      newPAV.policies.agreement_url,
      newPAV.policies.agreement_signed_at,
    ];

    const completed = fieldsToCheck.filter(Boolean).length;
    newPAV.profile_completion_score = Math.round((completed / fieldsToCheck.length) * 100) || 0;

    const savedPAV = await newPAV.save();

    // Vendor linking, normalized label
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await PhotographerVideographer.findByIdAndDelete(savedPAV._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    const normalizedLabel = normalizeServiceName("Photographer & Videographer");

    if (!Array.isArray(vendor.services)) vendor.services = [];
    if (!vendor.services.includes(savedPAV.service_id)) vendor.services.push(savedPAV.service_id);

    if (!Array.isArray(vendor.service_types)) vendor.service_types = [];
    const idx = vendor.service_types.findIndex(
      (st) => st?.service_name?.toLowerCase() === normalizedLabel.toLowerCase()
    );

    const updatedEntry = {
      service_name: normalizedLabel,
      service_status: "Inactive",
      service_id: savedPAV.service_id,
    };

    if (idx >= 0) {
      vendor.service_types[idx] = { ...vendor.service_types[idx], ...updatedEntry };
    } else {
      vendor.service_types.push(updatedEntry);
    }

    await vendor.save();
    await updateSectionCompletion(savedPAV.vendor_id);

    if (process.env.IS_DEV !== "true") {
      await sendEmailToSlack({
        name: savedPAV.business_details.business_registration_name,
        type: savedPAV.service_type,
      });
    }

    res.status(201).json(savedPAV);
  } catch (error) {
    console.error("Error creating photographer:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllPav = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;

    const { exclude_id, exclude } = req.query;
    let excludeIds = [];
    if (Array.isArray(exclude)) excludeIds = exclude;
    else if (typeof exclude === "string") excludeIds = exclude.split(",").map(s => s.trim()).filter(Boolean);
    if (exclude_id) excludeIds.push(String(exclude_id));

    const filter = excludeIds.length ? { service_id: { $nin: excludeIds } } : {};

    const [pav, totalpav] = await Promise.all([
      PhotographerVideographer.find(filter).skip(skip).limit(itemsPerPage),
      PhotographerVideographer.countDocuments(filter),
    ]);

    res.status(200).json({
      data: pav,
      currentPage: page,
      totalPages: Math.ceil(totalpav / itemsPerPage),
      totalItems: totalpav,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


const getPhotographerById = async (req, res) => {
  try {
    const { id } = req.params;
    const photographer = await PhotographerVideographer.findOne({ service_id: id });

    if (!photographer) {
      return res.status(404).json({ message: "Photographer not found" });
    }

    res.status(200).json(photographer);
  } catch (error) {
    console.error("Error fetching photographer:", error);
    res.status(400).json({ message: error.message });
  }
};

export default { createPhotographer, getAllPav, getPhotographerById };
