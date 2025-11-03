import DjArtist from "../../models2/djArtist.js";
import { Vendor } from "../../models2/vendor.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId2.js";
import { DjArtistReduxModel } from "../../models2/reduxModels/djArtist.js";

// Helpers
const getFileUrls = (files, fieldName) => {
  const fileArray = files?.[fieldName];
  if (!fileArray) return [];
  return Array.isArray(fileArray) ? fileArray.map((f) => f.location) : [fileArray.location];
};

const normalizeServiceName = (label) => {
  if (!label) return label;
  const s = String(label).trim().toLowerCase();
  if (["dj-artist", "dj artist", "djartist"].includes(s)) return "DJ-Artist";
  return label;
};

const checkCompletion = (section) => {
  if (!section || typeof section !== "object") return false;
  return Object.keys(section).every((key) => {
    const value = section[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
};

const updateSectionCompletion = async (vendor_id) => {
  try {
    const doc = await DjArtist.findOne({ vendor_id });
    if (!doc) {
      throw new Error("DJ Artist not found");
    }

    doc.basic_details.is_completed = checkCompletion(doc.basic_details || {});
    doc.service_details.is_completed = checkCompletion(doc.service_details || {});
    doc.additional_details.is_completed = checkCompletion(doc.additional_details || {});
    doc.policies.is_completed = checkCompletion(doc.policies || {});
    doc.business_details.is_completed = checkCompletion(doc.business_details || {});
    doc.bank_details.is_completed = checkCompletion(doc.bank_details || {});

    await doc.save();
  } catch (err) {
    console.error("Error updating section completion:", err);
    throw err;
  }
};

const createDjArtist = async (req, res) => {
  try {
    // Backward compatibility: allow service_type_business to set service_type
    if (!req.body.service_type && req.body.service_type_business) {
      req.body.service_type = req.body.service_type_business;
    }

    const { vendor_id } = req.body;
    if (!vendor_id) return res.status(400).json({ message: "vendor_id is required" });

    // Check if DJ Artist already exists for this vendor
    const alreadyExists = await DjArtist.findOne({ vendor_id });
    if (alreadyExists) {
      return res.status(400).json({ message: "DJ Artist already exists" });
    }

    // Generate service id
    const service_id = generateUniqueId("DJS");

    // Pull agreement data from redux/temp model
    const temp = await DjArtistReduxModel.findOne({ vendor_id });
    const agreementUrl = temp?.agreement_url || null;
    const agreementSignedAt = temp?.agreement_signed_at || null;

    // Files or body URLs
    // Normalize images/videos from multiple possible payload shapes (files or urls)
    const coerceToArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const pickFirstNonEmpty = (...candidates) => {
      for (const c of candidates) {
        const arr = coerceToArray(c).filter(Boolean);
        if (arr.length > 0) return arr;
      }
      return [];
    };

    const assetImages = pickFirstNonEmpty(
      req.files ? getFileUrls(req.files, "asset_images") : [],
      req.body.asset_images,
      req.body["asset_images[]"],
      req.body.photos,
      req.body["photos[]"],
    );
    const assetVideos = pickFirstNonEmpty(
      req.files ? getFileUrls(req.files, "asset_videos") : [],
      req.body.asset_videos,
      req.body["asset_videos[]"],
      req.body.videos,
      req.body["videos[]"],
    );

    // Normalize arrays
    const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    // Build document
    const serviceTypeLabel = req.body.service_type || "DJ-Artist";
    const normalizedLabel = normalizeServiceName(serviceTypeLabel);

    const doc = new DjArtist({
      vendor_id,
      service_id,
      service_type: normalizedLabel || "DJ-Artist",
      is_active: true,
      profile_completion_score: 0,
      service_areas: arr(req.body.service_areas),

      // bank_details: accept nested when sent; else empty object
      bank_details: {
        bank_name: req.body.bank_name,
        account_type: req.body.account_type,
        account_number: req.body.account_number,
        ifsc: req.body.ifsc,
        service_id: service_id,
        vendor_id: vendor_id,
      },

      // business_details: explicitly map the fields we expect
      business_details: {
        business_registration_name: req.body.business_registration_name || "",
        gst: req.body.gst || "",
        verification_type: req.body.verification_type || "",
        pan: req.body.pan || "",
        category: req.body.category ?? null,
        team_size: req.body.team_size ?? 0,
        years_of_operation: req.body.years_of_operation ?? 0,
        business_address: req.body.business_address || "",
        landmark: req.body.landmark || "",
        pincode: req.body.pincode ?? 0,
        operational_cities: arr(req.body.operational_cities),
        annual_revenue: req.body.annual_revenue || "",
        annual_bookings: req.body.annual_bookings ?? 0,
        service_type: normalizedLabel || "DJ-Artist",
        service_id,
      },

      basic_details: {
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        description: req.body.description,
        service_location_dj_artist: {
          service_address: req.body.service_address,
          lat: req.body.service_lat,
          lon: req.body.service_lon,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        },
      },

      service_details: {
        event_types_dj: arr(req.body.event_types_dj),
        music_genres: arr(req.body.music_genres),
        regional_specializations: arr(req.body.regional_specializations),
        services_offered: arr(req.body.services_offered),
      },

      additional_details: {
        asset_images: assetImages.length > 0
          ? assetImages
          : (Array.isArray(req.body.photos) ? req.body.photos : (req.body.photos ? [req.body.photos] : [])),
        asset_videos: assetVideos.length > 0
          ? assetVideos
          : (Array.isArray(req.body.videos) ? req.body.videos : (req.body.videos ? [req.body.videos] : [])),
        ig_socials_link: req.body.ig_socials_link || "",
        web_social_link: req.body.web_social_link || "",
        prices_starts_from: Number(req.body.prices_starts_from ?? 0),
      },

      policies: {
        terms_and_conditions: arr(req.body.terms_and_conditions),
        cancellation_policy: arr(req.body.cancellation_policy),
        agreement_url: agreementUrl || req.body.agreement_url || "",
        agreement_signed_at: agreementSignedAt || req.body.agreement_signed_at || null,
      },
    });

    // Compute profile completion percent similar to Venue
    const fieldsToCheck = [
      // Meta
      vendor_id,
      req.body.service_type,
      arr(req.body.service_areas).length > 0,

      // Business details
      req.body.business_registration_name,
      req.body.gst,
      req.body.verification_type,
      req.body.pan,
      req.body.category,
      req.body.team_size,
      req.body.years_of_operation,
      req.body.business_address,
      req.body.landmark,
      req.body.pincode,
      arr(req.body.operational_cities).length > 0,
      req.body.annual_revenue,
      req.body.annual_bookings,

      // Basic details
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.description,
      req.body.service_address,
      req.body.service_lat,
      req.body.service_lon,
      req.body.service_pincode,
      req.body.google_map_link,

      // Service details
      arr(req.body.event_types_dj).length > 0,
      arr(req.body.music_genres).length > 0,
      arr(req.body.regional_specializations).length > 0,
      arr(req.body.services_offered).length > 0,

      // Additional details
      assetImages.length > 0,
      assetVideos.length > 0,
      req.body.prices_starts_from,
      req.body.ig_socials_link,
      req.body.web_social_link,

      // Policies
      arr(req.body.terms_and_conditions).length > 0,
      arr(req.body.cancellation_policy).length > 0,
    ];
    const completedFields = fieldsToCheck.filter(Boolean).length;
    const profile_completion_score = Math.round((completedFields / fieldsToCheck.length) * 100) || 0;
    doc.profile_completion_score = profile_completion_score;

    const saved = await doc.save();

    // Link to vendor
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      await DjArtist.findByIdAndDelete(saved._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.services = Array.isArray(vendor.services) ? vendor.services : [];
    if (!vendor.services.includes(saved.service_id)) vendor.services.push(saved.service_id);

    vendor.service_types = Array.isArray(vendor.service_types) ? vendor.service_types : [];
    const idx = vendor.service_types.findIndex(
      (st) =>
        st &&
        typeof st.service_name === "string" &&
        st.service_name.toLowerCase() === (normalizedLabel || "DJ-Artist").toLowerCase()
    );

    const updatedEntry = {
      service_name: normalizedLabel || "DJ-Artist",
      service_status: "Inactive",
      service_id: saved.service_id,
    };

    if (idx >= 0) {
      vendor.service_types[idx] = { ...vendor.service_types[idx], ...updatedEntry };
    } else {
      vendor.service_types.push(updatedEntry);
    }

    await vendor.save();

    // Update section flags
    await updateSectionCompletion(saved.vendor_id);

    // Notify
    if (process.env.IS_DEV !== "true") {
      try {
        await sendEmailToSlack({
          name: saved?.basic_details?.point_of_contact || "DJ-Artist",
          type: saved?.service_type || "DJ-Artist",
        });
      } catch (_) { }
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating DJ Artist:", err);
    res.status(500).json({ message: err.message });
  }
};

// List with pagination
const getAllDjArtists = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 9));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      DjArtist.find().skip(skip).limit(limit),
      DjArtist.countDocuments(),
    ]);

    res.json({
      data,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
const getDjArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const djArtist = await DjArtist.findOne({ service_id: id });
    if (!djArtist) return res.status(404).json({ message: "DJ Artist not found" });
    res.json(djArtist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateDjArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    // Handle file uploads (store under additional_details.* like other flows)
    if (req.files) {
      if (req.files.asset_images) {
        updateData["additional_details.asset_images"] = getFileUrls(req.files, 'asset_images');
      }
      if (req.files.asset_videos) {
        updateData["additional_details.asset_videos"] = getFileUrls(req.files, 'asset_videos');
      }
      // performance_samples is optional and not defined in schema; only set if needed later
      // if (req.files.performance_samples) {
      //   updateData["additional_details.performance_samples"] = getFileUrls(req.files, 'performance_samples');
      // }
    }

    // Normalize common client payload shapes to additional_details.*
    // Support either nested additional_details or flat photos/videos keys
    if (updateData.additional_details && Array.isArray(updateData.additional_details.photos)) {
      updateData["additional_details.asset_images"] = updateData.additional_details.photos;
      delete updateData.additional_details.photos;
    }
    if (updateData.additional_details && Array.isArray(updateData.additional_details.videos)) {
      updateData["additional_details.asset_videos"] = updateData.additional_details.videos;
      delete updateData.additional_details.videos;
    }
    if (Array.isArray(updateData.photos)) {
      updateData["additional_details.asset_images"] = updateData.photos;
      delete updateData.photos;
    }
    if (Array.isArray(updateData.videos)) {
      updateData["additional_details.asset_videos"] = updateData.videos;
      delete updateData.videos;
    }

    const updated = await DjArtist.findOneAndUpdate(
      { service_id: id },
      { $set: updateData },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "DJ Artist not found" });
    await updateSectionCompletion(updated.vendor_id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deleteDjArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DjArtist.findOneAndDelete({ service_id: id });
    if (!deleted) return res.status(404).json({ message: "DJ Artist not found" });
    // Remove from vendor services
    const vendor = await Vendor.findOne({ vendor_id: deleted.vendor_id });
    if (vendor) {
      vendor.services = vendor.services.filter(sid => sid !== id);
      vendor.service_types = vendor.service_types.filter(st => st.service_id !== id);
      await vendor.save();
    }
    res.json({ message: "DJ Artist deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export {
  createDjArtist,
  getAllDjArtists,
  getDjArtistById,
  updateDjArtist,
  deleteDjArtist,
};