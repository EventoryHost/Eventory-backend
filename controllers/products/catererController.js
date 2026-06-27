import { Caterer } from "../../models/caterer.js";
import { ReduxCatererModel } from "../../models/reduxModels/caterer.js";
import { Vendor } from "../../models/vendor.js";

import generateUniqueId from "../../utils/generateId.js";
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
  if (!input) return [];
  if (typeof input === "string") {
    const s = input.trim();
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        return normalizePhotos(JSON.parse(s));
      } catch {}
    }
    return s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((u) => ({ original: u, preview: u }));
  }
  if (Array.isArray(input)) {
    return input
      .map((it) => {
        if (!it) return null;
        if (typeof it === "string") return { original: it, preview: it };
        const unwrap = (v) => {
          if (typeof v === "string" && v.trim().startsWith("[")) {
            try {
              const arr = JSON.parse(v);
              const first = Array.isArray(arr) ? arr[0] : arr;
              return first?.original || first?.preview || "";
            } catch {
              return v;
            }
          }
          return v;
        };
        const original = unwrap(it.original) || unwrap(it.url) || "";
        const preview = unwrap(it.preview) || original;
        return original ? { original, preview } : null;
      })
      .filter(Boolean);
  }
  return [];
}

export function normalizeVideos(input) {
  if (!input) return [];
  if (typeof input === "string") {
    try {
      return normalizeVideos(JSON.parse(input));
    } catch {
      return input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (Array.isArray(input)) return input.map((v) => String(v)).filter(Boolean);
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
// Function to update the section completion status
const updateSectionCompletion = async (vendorId) => {
  try {
    const caterer = await Caterer.findOne({
      vendor_id: vendorId,
    });

    if (!caterer) {
      throw new Error("Caterer not found");
    }

    // Match schema field names
    caterer.basic_details.is_completed = checkCompletion(
      caterer.basic_details || {},
    );
    // caterer.menu_details.is_completed = checkCompletion(
    //   caterer.menu_details || {}
    // );
    caterer.event_details.is_completed = checkCompletion(
      caterer.event_details || {},
    );
    caterer.additional_details.is_completed = checkCompletion(
      caterer.additional_details || {},
    );
    caterer.policies.is_completed = checkCompletion(caterer.policies || {});
    caterer.business_details.is_completed = checkCompletion(
      caterer.business_details || {},
    );

    await caterer.save();
  } catch (error) {
    console.error("Error in updateSectionCompletion:", error);
    throw error;
  }
};

const normalizeServiceName = (label) => {
  if (!label) return label;
  const s = String(label).trim().toLowerCase();
  if (["venue provider", "venue-provider", "venueprovider"].includes(s))
    return "Venue Provider";
  if (["makeup-artist", "makeup artist", "makeupartist"].includes(s))
    return "Makeup-Artist";
  if (["caterer"].includes(s)) return "Caterer";
  if (["decorator"].includes(s)) return "Decorator";
  if (
    [
      "photographer & videographer",
      "photographer and videographer",
      "pav",
    ].includes(s)
  )
    return "Photographer & Videographer";
  return label;
};

const createCaterer = async (req, res) => {
  try {
    // Prevent duplicate caterer per vendor
    const exists = await Caterer.findOne({ vendor_id: req.body.vendor_id });
    if (exists)
      return res.status(400).json({ message: "Caterer already exists" });

    // Pull media from body (top-level) and normalize to expected shapes
    const menu = Array.isArray(req.body.menu)
      ? req.body.menu
      : [req.body.menu].filter(Boolean);
    const asset_images = normalizePhotos(req.body.asset_images);
    const asset_videos = normalizeVideos(req.body.asset_videos);
    const food_safety_certificates = normalizeVideos(
      req.body.food_safety_certificates,
    ); // typically strings; reuse video normalizer for string[] parsing

    // Agreements from temporary redux model
    const tempCatererData = await ReduxCatererModel.findOne({
      vendor_id: req.body.vendor_id,
    });
    let agreementUrl = tempCatererData?.agreement_url || " ";
    let agreementSignedAt = tempCatererData?.agreement_signed_at || new Date();

    // Compute profile completion using normalized arrays when applicable
    const fieldsToCheck = [
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.min_booking_capacity,
      req.body.max_booking_capacity,
      req.body.description,
      (req.body.cuisine_specialities || []).length > 0,
      (req.body.regional_specialities || []).length > 0,
      (req.body.service_style_offered || []).length > 0,
      req.body.service_location_caterer?.lat,
      req.body.service_location_caterer?.lon,
      req.body.service_location_caterer?.service_pincode,
      req.body.service_location_caterer?.google_map_link,

      // Menu
      req.body.veg_or_nonveg,
      menu.length > 0 ||
        ((req.body.appetizers || []).length > 0 &&
          (req.body.beverages || []).length > 0 &&
          (req.body.main_course || []).length > 0),
      (req.body.special_dietary_options || []).length > 0,
      req.body.menu_customizable,

      // Event
      (req.body.event_types_catered || []).length > 0,
      (req.body.additional_services_for_any_event || []).length > 0,
      (req.body.staff_provided || []).length > 0,
      (req.body.equipment_provided || []).length > 0,

      // Additional
      req.body.min_booking_period,
      req.body.max_booking_period,
      asset_images.length > 0, // normalized
      asset_videos.length > 0, // normalized
      req.body.is_tasting_session_provided,
      req.body.is_business_license_available,
      food_safety_certificates.length > 0,
      req.body.prices_starts_from,

      // Policies
      req.body.cancellation_policy,
      req.body.terms_and_conditions,

      // Business details
      req.body.category,
      req.body.business_registration_name,
      req.body.gst,
      req.body.pan || null,
      req.body.verification_type,
      req.body.team_size,
      req.body.years_of_operation,
      req.body.business_address,
      req.body.landmark,
      req.body.pincode,
      req.body.operational_cities,
      req.body.annual_revenue,
      req.body.annual_bookings,
      req.body.account_type,
      req.body.vendor_id,
    ];
    const completedFields = fieldsToCheck.filter(Boolean).length;
    const profile_completion_score =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    const service_id = generateUniqueId("CAT");

    const newCaterer = new Caterer({
      vendor_id: req.body.vendor_id,
      service_areas: req.body.service_areas || [],
      service_id,

      basic_details: {
        is_completed: false,
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        min_booking_capacity: parseInt(req.body.min_booking_capacity, 10),
        max_booking_capacity: parseInt(req.body.max_booking_capacity, 10),
        description: req.body.description,
        cuisine_specialities: req.body.cuisine_specialities || [],
        regional_specialities: req.body.regional_specialities || [],
        service_style_offered: req.body.service_style_offered || [],
        service_location_caterer: {
          service_address: req.body.address,
          lat: req.body.latitude ?? req.body.service_lat,
          lon: req.body.longitude ?? req.body.service_lon,
          service_pincode: parseInt(
            req.body.pincode ?? req.body.service_pincode,
            10,
          ),
          google_map_link: req.body.google_map_link,
        },
      },

      event_details: {
        is_completed: false,
        event_types_catered: req.body.event_types_catered || [],
        additional_services_for_any_event:
          req.body.additional_services_for_any_event || [],
        staff_provided: req.body.staff_provided || [],
        equipment_provided: req.body.equipment_provided || [],
        menu,
        veg_or_nonveg: req.body.veg_or_nonveg,
        appetizers: req.body.appetizers || [],
        main_course: req.body.main_course || [],
        beverages: req.body.beverages || [],
        special_dietary_options: req.body.special_dietary_options || [],
        pre_set_menus: req.body.pre_set_menus || [],
        menu_customizable:
          req.body.menu_customizable === "true" ||
          req.body.menu_customizable === true,
      },

      additional_details: {
        is_completed: false,
        min_booking_period: parseInt(req.body.min_booking_period, 10),
        max_booking_period:
          parseInt(req.body.max_booking_period, 10) || undefined,
        asset_images, // [{ original, preview }]
        asset_videos, // [string]
        is_tasting_session_provided:
          req.body.is_tasting_session_provided === "true" ||
          req.body.is_tasting_session_provided === true,
        is_business_license_available:
          req.body.is_business_license_available === "true" ||
          req.body.is_business_license_available === true,
        food_safety_certificates, // [string]
        prices_starts_from: parseInt(req.body.prices_starts_from, 10),
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
        service_type: req.body.service_type || "Catering",
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

    const saved = await newCaterer.save();

    // Vendor linking (idempotent)
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await Caterer.findByIdAndDelete(saved._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    const normalizedLabel = normalizeServiceName("Caterer");

    if (!Array.isArray(vendor.services)) vendor.services = [];
    if (!vendor.services.includes(saved.service_id))
      vendor.services.push(saved.service_id);

    if (!Array.isArray(vendor.service_types)) vendor.service_types = [];
    const idx = vendor.service_types.findIndex(
      (st) => st?.service_name?.toLowerCase() === normalizedLabel.toLowerCase(),
    );
    const updatedEntry = {
      service_name: normalizedLabel,
      service_status: "Inactive",
      service_id: saved.service_id,
    };
    if (idx >= 0)
      vendor.service_types[idx] = {
        ...vendor.service_types[idx],
        ...updatedEntry,
      };
    else vendor.service_types.push(updatedEntry);

    await vendor.save();
    await updateSectionCompletion(saved.vendor_id);

    if (process.env.IS_DEV !== "true") {
      await sendEmailToSlack({
        name: saved.basic_details.point_of_contact,
        type: saved.service_type,
      });
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllCaterers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const skip = (page - 1) * itemsPerPage;

    // inline exclude support
    const { exclude_id, exclude } = req.query;
    let excludeIds = [];
    if (Array.isArray(exclude)) excludeIds = exclude;
    else if (typeof exclude === "string")
      excludeIds = exclude
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (exclude_id) excludeIds.push(String(exclude_id));

    const filter = excludeIds.length
      ? { service_id: { $nin: excludeIds } }
      : {};

    const [caterers, totalCaterers] = await Promise.all([
      Caterer.find(filter).skip(skip).limit(itemsPerPage),
      Caterer.countDocuments(filter),
    ]);

    res.status(200).json({
      data: caterers,
      currentPage: page,
      totalPages: Math.ceil(totalCaterers / itemsPerPage),
      totalItems: totalCaterers,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getCatererById = async (req, res) => {
  try {
    const { id } = req.params;

    const caterer = await Caterer.findOne({ service_id: id });

    if (!caterer) {
      return res.status(404).json({ message: "Caterer not found" });
    }

    res.status(200).json(caterer);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createCaterer, getAllCaterers, getCatererById };
