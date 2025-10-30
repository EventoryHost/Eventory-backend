import DjArtist from "../../models2/djArtist.js";
import { Vendor } from "../../models2/vendor.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId2.js";
import { DjArtistReduxModel } from "../../models2/reduxModels/djArtist.js";

// Helpers
const getFileUrls = (files, fieldName) => {
  const fileArray = files?.[fieldName];
  if (!fileArray) return [];
  return Array.isArray(fileArray) ? fileArray.map(f => f.location) : [fileArray.location];
};

const isTruthy = (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && Object.keys(v || {}).length === 0);

const checkCompletion = (section) => {
  if (!section) return false;
  // consider nested objects/arrays non-empty too
  return Object.values(section).some(isTruthy);
};

const updateSectionCompletion = async (vendor_id) => {
  try {
    const djArtist = await DjArtist.findOne({ vendor_id });
    if (!djArtist) return;

    const basicDetailsCompleted = checkCompletion(djArtist.basic_details);
    const serviceDetailsCompleted = checkCompletion(djArtist.service_details);
    const additionalDetailsCompleted = checkCompletion(djArtist.additional_details);
    const policiesCompleted = checkCompletion(djArtist.policies);
    const businessDetailsCompleted = checkCompletion(djArtist.business_details);
    const bankDetailsCompleted = checkCompletion(djArtist.bank_details);

    const completedSectionsCount = [
      basicDetailsCompleted,
      serviceDetailsCompleted,
      additionalDetailsCompleted,
      policiesCompleted,
      businessDetailsCompleted,
      bankDetailsCompleted,
    ].filter(Boolean).length;

    const completionScore = Math.round((completedSectionsCount / 6) * 100);

    await DjArtist.findOneAndUpdate(
      { vendor_id },
      {
        $set: {
          "basic_details.is_completed": basicDetailsCompleted,
          "service_details.is_completed": serviceDetailsCompleted,
          "additional_details.is_completed": additionalDetailsCompleted,
          "policies.is_completed": policiesCompleted,
          "business_details.is_completed": businessDetailsCompleted,
          "bank_details.is_completed": bankDetailsCompleted,
          profile_completion_score: completionScore,
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating section completion:", error);
  }
};

// Create
const createDjArtist = async (req, res) => {
  try {
    const { vendor_id } = req.body;
    if (!vendor_id) return res.status(400).json({ message: "vendor_id is required" });

    const existingArtist = await DjArtist.findOne({ vendor_id });
    if (existingArtist) {
      return res.status(400).json({ message: "DJ Artist already exists" });
    }

    // normalized prefix to DJS per schema
    const service_id = generateUniqueId("DJS");

    // Get temp agreement values if present
    const tempData = await DjArtistReduxModel.findOne({ vendor_id });
    const agreementUrl = tempData?.agreement_url || "";
    const agreementSignedAt = tempData?.agreement_signed_at || null;

    // Files (multipart)
    const assetImages = req.files ? getFileUrls(req.files, "asset_images") : (req.body.asset_images || []);
    const assetVideos = req.files ? getFileUrls(req.files, "asset_videos") : (req.body.asset_videos || []);

    const newDjArtist = new DjArtist({
      service_id,
      vendor_id,
      service_type: req.body.service_type || "DJ-Artist",
      is_active: true,
      profile_completion_score: 0,
      service_areas: Array.isArray(req.body.service_areas) ? req.body.service_areas : (req.body.service_areas ? [req.body.service_areas] : []),

      // common embedded
      bank_details: req.body.bank_details || {},
      business_details: req.body.business_details || {},

      basic_details: {
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        description: req.body.description,
        address: req.body.address,
        service_areas: Array.isArray(req.body.basic_service_areas)
          ? req.body.basic_service_areas
          : (req.body.basic_service_areas ? [req.body.basic_service_areas] : []),
        service_location_dj_artist: {
          service_address: req.body.service_address,
          lat: req.body.service_lat,
          lon: req.body.service_lon,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        },
      },

      service_details: {
        event_types_dj: Array.isArray(req.body.event_types_dj)
          ? req.body.event_types_dj
          : (req.body.event_types_dj ? [req.body.event_types_dj] : []),
        music_genres: Array.isArray(req.body.music_genres)
          ? req.body.music_genres
          : (req.body.music_genres ? [req.body.music_genres] : []),
        regional_specializations: Array.isArray(req.body.regional_specializations)
          ? req.body.regional_specializations
          : (req.body.regional_specializations ? [req.body.regional_specializations] : []),
        services_offered: Array.isArray(req.body.services_offered)
          ? req.body.services_offered
          : (req.body.services_offered ? [req.body.services_offered] : []),
      },

      additional_details: {
        asset_images: assetImages,
        asset_videos: assetVideos,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
        prices_starts_from: Number(req.body.prices_starts_from || 0),
      },

      policies: {
        terms_and_conditions: Array.isArray(req.body.terms_and_conditions)
          ? req.body.terms_and_conditions
          : (req.body.terms_and_conditions ? [req.body.terms_and_conditions] : []),
        cancellation_policy: Array.isArray(req.body.cancellation_policy)
          ? req.body.cancellation_policy
          : (req.body.cancellation_policy ? [req.body.cancellation_policy] : []),
        agreement_url: agreementUrl || req.body.agreement_url || "",
        agreement_signed_at: agreementSignedAt || req.body.agreement_signed_at || null,
      },
    });

    const saved = await newDjArtist.save();

    // Attach to vendor
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      await DjArtist.findByIdAndDelete(saved._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.services = Array.isArray(vendor.services) ? vendor.services : [];
    vendor.service_types = Array.isArray(vendor.service_types) ? vendor.service_types : [];

    if (!vendor.services.includes(saved.service_id)) {
      vendor.services.push(saved.service_id);
    }
    vendor.service_types.push({
      service_name: "DJ-Artist",
      service_status: "Inactive",
      service_id: saved.service_id,
    });

    await vendor.save();

    await updateSectionCompletion(saved.vendor_id);

    if (process.env.IS_DEV !== "true") {
      try {
        await sendEmailToSlack({
          name: saved?.basic_details?.point_of_contact || "DJ-Artist",
          type: saved?.service_type || "DJ-Artist",
        });
      } catch { }
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
    const updateData = req.body;
    // Handle file uploads
    if (req.files) {
      if (req.files.asset_images) {
        updateData.asset_images = getFileUrls(req.files, 'asset_images');
      }
      if (req.files.asset_videos) {
        updateData.asset_videos = getFileUrls(req.files, 'asset_videos');
      }
      if (req.files.performance_samples) {
        updateData.performance_samples = getFileUrls(req.files, 'performance_samples');
      }
    }
    const updated = await DjArtist.findOneAndUpdate({ service_id: id }, { $set: updateData }, { new: true });
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