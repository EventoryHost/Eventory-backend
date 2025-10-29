import { set } from "mongoose";
import DjArtist from "../../models2/djArtist.js";
import { Vendor } from "../../models2/vendor.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId2.js";
import { DjArtistReduxModel } from "../../models2/reduxModels/djArtist.js";
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
  if (!section) return false;
  const fields = Object.values(section);
  return fields.some(field => field !== null && field !== undefined && field !== "");
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
      basicDetailsCompleted, serviceDetailsCompleted, additionalDetailsCompleted,
      policiesCompleted, businessDetailsCompleted, bankDetailsCompleted
    ].filter(Boolean).length;
    const completionScore = Math.round((completedSectionsCount / 6) * 100);
    await DjArtist.findOneAndUpdate(
      { vendor_id },
      {
        $set: {
          'basic_details.is_completed': basicDetailsCompleted,
          'service_details.is_completed': serviceDetailsCompleted,
          'additional_details.is_completed': additionalDetailsCompleted,
          'policies.is_completed': policiesCompleted,
          'business_details.is_completed': businessDetailsCompleted,
          'bank_details.is_completed': bankDetailsCompleted,
          profile_completion_score: completionScore
        }
      }
    );
  } catch (error) {
    console.error("Error updating section completion:", error);
  }
};
const createDjArtist = async (req, res) => {
  try {
    const existingArtist = await DjArtist.findOne({ vendor_id: req.body.vendor_id });
    if (existingArtist) {
      return res.status(400).json({ message: "DJ Artist already exists" });
    }
    const service_id = generateUniqueId("DJ");
    const tempData = await DjArtistReduxModel.findOne({ vendor_id: req.body.vendor_id });
    const agreementUrl = tempData?.agreement_url || " ";
    const agreementSignedAt = tempData?.agreement_signed_at || new Date();
    const newDjArtist = new DjArtist({
      service_id,
      vendor_id: req.body.vendor_id,
      service_type: req.body.service_type || "Dj-Artist",
      service_areas: req.body.service_areas || [],
      is_active: true,
      profile_completion_score: 0,
      basicDetails: {
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        description: req.body.description,
        event_types: req.body.event_types || [],
        music_genres: req.body.music_genres || [],
        regional_specializations: req.body.regional_specializations || [],
        service_location_dj_artist: {
          service_address: req.body.service_address,
          lat: req.body.service_lat,
          lon: req.body.service_lon,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        }
      },
      serviceDetails: {
        services_offered: req.body.services_offered || [],
        equipment_provided: req.body.equipment_provided || [],
        sound_system_specifications: req.body.sound_system_specifications,
        lighting_equipment_available: req.body.lighting_equipment_available || [],
        is_mc_services_provided: req.body.is_mc_services_provided,
        is_karaoke_services_available: req.body.is_karaoke_services_available,
        is_custom_playlist_creation: req.body.is_custom_playlist_creation,
        performance_duration_options: req.body.performance_duration_options || [],
      },
      additionalDetails: {
        asset_images: req.body.asset_images || [],
        asset_videos: req.body.asset_videos || [],
        performance_samples: req.body.performance_samples || [],
        min_booking_period: req.body.min_booking_period,
        max_booking_period: req.body.max_booking_period,
        prices_starts_from: req.body.prices_starts_from,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
        awards: req.body.awards,
        testimonials: req.body.testimonials || [],
      },
      policies: {
        cancellation_policy: req.body.cancellation_policy,
        terms_and_conditions: req.body.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      }
    });
    const saved = await newDjArtist.save();
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await DjArtist.findByIdAndDelete(saved._id);
      return res.status(404).json({ message: "Vendor not found" });
    }
    vendor.services.push(saved.service_id);
    vendor.service_types.push({
      service_name: "DJ-Artist",
      service_status: "Inactive",
      service_id: saved.service_id
    });
    await vendor.save();
    await updateSectionCompletion(saved.vendor_id);
    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({ name: saved.basic_details.point_of_contact, type: saved.service_type });
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating DJ Artist:", err);
    res.status(500).json({ message: err.message });
  }
};
const getAllDjArtists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const data = await DjArtist.find().skip(skip).limit(limit);
    const total = await DjArtist.countDocuments();
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