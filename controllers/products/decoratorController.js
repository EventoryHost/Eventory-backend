import { set } from "mongoose";
import { Decorator } from "../../models/decorator.js";
// import { DecoratorModel } from "../../models/reduxStores/decorator.js";
import { Vendor } from "../../models/vendor.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId.js";
import { ReduxDecoratorModel } from "../../models/reduxModels/decorator.js";

const getFileUrls = (files, fieldName) => {
  // Handle cases where there might be a single file instead of an array of files
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
  if (!input) return [];
  if (typeof input === "string") {
    const s = input.trim();
    if (s.startsWith("[") || s.startsWith("{")) {
      try { return normalizePhotos(JSON.parse(s)); } catch { }
    }
    return s.split(",").map(t => t.trim()).filter(Boolean).map(u => ({ original: u, preview: u }));
  }
  if (Array.isArray(input)) {
    return input.map((it) => {
      if (!it) return null;
      if (typeof it === "string") return { original: it, preview: it };
      const unwrap = (v) => {
        if (typeof v === "string" && v.trim().startsWith("[")) {
          try {
            const arr = JSON.parse(v);
            const first = Array.isArray(arr) ? arr[0] : arr;
            return first?.original || first?.preview || "";
          } catch { return v; }
        }
        return v;
      };
      const original = unwrap(it.original) || unwrap(it.url) || "";
      const preview = unwrap(it.preview) || original;
      return original ? { original, preview } : null;
    }).filter(Boolean);
  }
  return [];
}

export function normalizeVideos(input) {
  if (!input) return [];
  if (typeof input === "string") {
    try { return normalizeVideos(JSON.parse(input)); } catch {
      return input.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(input)) return input.map(v => String(v)).filter(Boolean);
  return [];
}

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

const updateSectionCompletion = async (vendorId) => {
  try {
    const decorator = await Decorator.findOne({ vendor_id: vendorId });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    // Match schema field names
    decorator.basic_details.is_completed = checkCompletion(
      decorator.basic_details || {}
    );

    decorator.theme_details.is_completed = checkCompletion(
      decorator.theme_details || {}
    );

    decorator.additional_details.is_completed = checkCompletion(
      decorator.additional_details || {}
    );

    decorator.policies.is_completed = checkCompletion(decorator.policies || {});

    decorator.business_details.is_completed = checkCompletion(
      decorator.business_details || {}
    );

    await decorator.save();
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

const createDecorator = async (req, res) => {
  try {
    // Prevent duplicates per vendor
    const exists = await Decorator.findOne({ vendor_id: req.body.vendor_id });
    if (exists) return res.status(400).json({ message: "Decorator already exists" });

    const service_id = generateUniqueId("DECO");

    // Agreements from temp redux model
    const temp = await ReduxDecoratorModel.findOne({ vendor_id: req.body.vendor_id });
    const agreementUrl = temp?.agreement_url || " ";
    const agreementSignedAt = temp?.agreement_signed_at || new Date();

    // Normalize media: accept JSON strings, arrays of objects/strings, CSV
    const theme_portfolio_images = normalizePhotos(req.body.theme_portfolio_images);
    const theme_portfolio_videos = normalizeVideos(req.body.theme_portfolio_videos);
    const asset_images = normalizePhotos(req.body.asset_images);
    const asset_videos = normalizeVideos(req.body.asset_videos);

    // -------------------------------
    // Profile completion check
    // -------------------------------
    const fieldsToCheck = [
      // IDs & Core
      req.body.vendor_id,
      req.body.service_id,
      req.body.service_type,
      req.body.service_areas,

      // Business details
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

      // Bank details
      req.body.account_holder_name,
      req.body.account_type,
      req.body.account_number,
      req.body.ifsc_code,
      req.body.bank_name,
      req.body.branch_name,

      // Decorator details
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.avg_setup_duration,
      req.body.description,
      req.body.event_types_decorated,
      req.body.themes_offered,
      req.body.is_prop_selection_available,
      req.body.any_custom_design_process,
      req.body.is_colour_scheme_assistance_provided,
      req.body.is_theme_customization_allowed,
      req.body.is_venue_adaptability,
      req.body.theme_elements_available,
      req.body.theme_portfolio_images,
      req.body.theme_portfolio_videos,
      req.body.asset_images,
      req.body.asset_videos,
      req.body.min_booking_period,
      req.body.prices_starts_from,
      req.body.ig_socials_link,
      req.body.web_social_link,
      req.body.is_theme_proposals_provided,
      req.body.is_proposal_revision_possible,

      // Location details
      req.body.lat,
      req.body.lon,
      req.body.service_pincode,
      req.body.google_map_link,

      // Policies & agreements
      req.body.cancellation_policy,
      req.body.terms_and_conditions,
    ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profile_completion_score =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    // Create
    const newDecorator = new Decorator({
      vendor_id: req.body.vendor_id,
      service_id,
      service_type: req.body.service_type || "Decorator",
      service_areas: req.body.service_areas || [],

      basic_details: {
        is_completed: false,
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        avg_setup_duration: req.body.avg_setup_duration,
        description: req.body.description,
        event_types_decorated: req.body.event_types_decorated || [],
        service_location_decorator: {
          service_address: req.body.address,
          lat: req.body.lat,
          lon: req.body.lon,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        },
      },

      theme_details: {
        is_completed: false,
        themes_offered: req.body.themes_offered || [],
        is_prop_selection_available: req.body.is_prop_selection_available,
        any_custom_design_process: req.body.any_custom_design_process,
        is_colour_scheme_assistance_provided: req.body.is_colour_scheme_assistance_provided,
        is_theme_customization_allowed: req.body.is_theme_customization_allowed,
        is_venue_adaptability: req.body.is_venue_adaptability,
        theme_elements_available: req.body.theme_elements_available || [],
        theme_portfolio_images,                 // [{original, preview}]
        theme_portfolio_videos,                 // [string]
      },

      additional_details: {
        is_completed: false,
        asset_images,                           // [{original, preview}]
        asset_videos,                           // [string]
        min_booking_period: req.body.min_booking_period,
        max_booking_period: req.body.max_booking_period,
        prices_starts_from: req.body.prices_starts_from,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
        is_theme_proposals_provided: req.body.is_theme_proposals_provided,
        is_proposal_revision_possible: req.body.is_proposal_revision_possible,
      },

      policies: {
        is_completed: false,
        cancellation_policy: req.body.cancellation_policy,
        terms_and_conditions: req.body.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      },

      business_details: {
        is_completed: false,
        service_id,
        service_type: req.body.service_type || "Decorator",
        category: req.body.category,
        business_registration_name: req.body.business_registration_name,
        gst: req.body.gst,
        pan: req.body.pan || null,
        verification_type: req.body.verification_type,
        team_size: req.body.team_size,
        years_of_operation: req.body.years_of_operation,
        business_address: req.body.business_address,
        landmark: req.body.landmark,
        pincode: req.body.pincode,
        operational_cities: req.body.operational_cities,
        annual_revenue: req.body.annual_revenue,
        annual_bookings: req.body.annual_bookings,
      },

      bank_details: {
        account_type: req.body.account_type,
        upi_id: req.body.upi_id,
        service_id,
        vendor_id: req.body.vendor_id,
      },

      profile_completion_score,
    });

    const saved = await newDecorator.save();

    // Vendor linking (idempotent)
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await Decorator.findByIdAndDelete(saved._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    const normalizedLabel = normalizeServiceName("Decorator");

    if (!Array.isArray(vendor.services)) vendor.services = [];
    if (!vendor.services.includes(saved.service_id)) vendor.services.push(saved.service_id);

    if (!Array.isArray(vendor.service_types)) vendor.service_types = [];
    const idx = vendor.service_types.findIndex(
      (st) => st?.service_name?.toLowerCase() === normalizedLabel.toLowerCase()
    );
    const updatedEntry = { service_name: normalizedLabel, service_status: "Inactive", service_id: saved.service_id };
    if (idx >= 0) vendor.service_types[idx] = { ...vendor.service_types[idx], ...updatedEntry };
    else vendor.service_types.push(updatedEntry);

    await vendor.save();
    await updateSectionCompletion(saved.vendor_id);

    if (process.env.IS_DEV !== "true") {
      await sendEmailToSlack({ name: saved.basic_details.point_of_contact, type: saved.service_type });
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating decorator:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllDecorators = async (req, res) => {
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

    const [decorators, totaldecorators] = await Promise.all([
      Decorator.find(filter).skip(skip).limit(itemsPerPage),
      Decorator.countDocuments(filter),
    ]);

    res.status(200).json({
      data: decorators,
      currentPage: page,
      totalPages: Math.ceil(totaldecorators / itemsPerPage),
      totalItems: totaldecorators,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};


const getDecoratorById = async (req, res) => {
  try {
    const { id } = req.params;
    const decorator = await Decorator.findOne({ service_id: id });

    if (!decorator) {
      return res.status(404).json({ message: "Decorator not found" });
    }

    res.status(200).json(decorator);
  } catch (error) {
    console.error("Error fetching decorator:", error);
    res.status(400).json({ message: error.message });
  }
};

export default { createDecorator, getAllDecorators, getDecoratorById };
