import { set } from "mongoose";
import DjArtist from "../../models2/djArtist.js";
import { Vendor } from "../../models2/vendor.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId2.js";
import { DjArtistReduxModel } from "../../models2/reduxModels/djArtist.js";

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

const checkCompletion = (section) => {
  if (!section) return false;
  const fields = Object.values(section);
  const completedFields = fields.filter(field => field !== null && field !== undefined && field !== "");
  return completedFields.length > 0;
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

    const completedSections = [
      basicDetailsCompleted,
      serviceDetailsCompleted,
      additionalDetailsCompleted,
      policiesCompleted,
      businessDetailsCompleted,
      bankDetailsCompleted
    ].filter(Boolean).length;

    const completionScore = Math.round((completedSections / 6) * 100);

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
    // Check for existing DJ artist
    const alreadyExists = await DjArtist.findOne({
      vendor_id: req.body.vendor_id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "DJ Artist already exists" });
    }

    const service_id = generateUniqueId("DJ");

    const tempDjData = await DjArtistReduxModel.findOne({
      vendor_id: req.body.vendor_id,
    });
    const agreementUrl = tempDjData?.agreement_url || " ";
    const agreementSignedAt = tempDjData?.agreement_signed_at || new Date();

    if (agreementUrl) {
      console.log("Found agreement data for DJ artist:", agreementUrl);
    }

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

      // DJ Artist details
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.description,
      req.body.event_types_performed,
      req.body.music_genres_specialized,
      req.body.regional_specializations,
      req.body.services_offered,
      req.body.equipment_provided,
      req.body.sound_system_specifications,
      req.body.lighting_equipment_available,
      req.body.is_mc_services_provided,
      req.body.is_karaoke_services_available,
      req.body.is_custom_playlist_creation,
      req.body.performance_duration_options,
      req.body.asset_images,
      req.body.asset_videos,
      req.body.performance_samples,
      req.body.min_booking_period,
      req.body.prices_starts_from,
      req.body.ig_socials_link,
      req.body.web_social_link,
      req.body.awards_achievements,
      req.body.testimonials,
      req.body.cancellation_policy,
      req.body.terms_and_conditions,
      agreementUrl,
      agreementSignedAt,
    ];

    const completedFields = fieldsToCheck.filter(field => field !== null && field !== undefined && field !== "");
    const profile_completion_score = Math.round((completedFields.length / fieldsToCheck.length) * 100);

    const newDjArtist = new DjArtist({
      service_id: service_id,
      vendor_id: req.body.vendor_id,
      service_type: req.body.service_type || "DJ-Artist",
      service_areas: req.body.service_areas || [],
      is_active: true,
      profile_completion_score: profile_completion_score || 0,

      business_details: {
        service_type: req.body.service_type || "DJ-Artist",
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
        service_id: service_id,
        vendor_id: req.body.vendor_id,
      },

      basic_details: {
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        description: req.body.description,
        event_types_performed: req.body.event_types_performed || [],
        music_genres_specialized: req.body.music_genres_specialized || [],
        regional_specializations: req.body.regional_specializations || [],
        service_location_dj_artist: {
          service_address: req.body.service_address,
          lat: req.body.service_lat,
          lon: req.body.service_lon,
          service_pincode: req.body.service_pincode,
          google_map_link: req.body.google_map_link,
        }
      },

      service_details: {
        services_offered: req.body.services_offered || [],
        equipment_provided: req.body.equipment_provided || [],
        sound_system_specifications: req.body.sound_system_specifications,
        lighting_equipment_available: req.body.lighting_equipment_available || [],
        is_mc_services_provided: req.body.is_mc_services_provided,
        is_karaoke_services_available: req.body.is_karaoke_services_available,
        is_custom_playlist_creation: req.body.is_custom_playlist_creation,
        performance_duration_options: req.body.performance_duration_options || [],
      },

      additional_details: {
        asset_images: req.body.asset_images || [],
        asset_videos: req.body.asset_videos || [],
        performance_samples: req.body.performance_samples || [],
        min_booking_period: req.body.min_booking_period,
        max_booking_period: req.body.max_booking_period,
        prices_starts_from: req.body.prices_starts_from,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
        awards_achievements: req.body.awards_achievements,
        testimonials: req.body.testimonials || [],
      },

      policies: {
        cancellation_policy: req.body.cancellation_policy,
        terms_and_conditions: req.body.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      },

      profile_completion_score: profile_completion_score || 0,
    });

    const savedDjArtist = await newDjArtist.save();

    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await DjArtist.findByIdAndDelete(savedDjArtist._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.services.push(savedDjArtist.service_id);
    vendor.service_types.push({
      "service_name": "DJ-Artist",
      "service_status": "Inactive",
      "service_id": savedDjArtist.service_id
    });
    await vendor.save();

    // Update section completion
    await updateSectionCompletion(savedDjArtist.vendor_id);

    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedDjArtist.basic_details.point_of_contact,
        type: savedDjArtist.service_type,
      });

    res.status(201).json(savedDjArtist);
  } catch (error) {
    console.error("Error creating DJ artist:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllDjArtists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const djArtists = await DjArtist.find().skip(skip).limit(itemsPerPage);

    const totalDjArtists = await DjArtist.countDocuments();

    res.status(200).json({
      data: djArtists,
      currentPage: page,
      totalPages: Math.ceil(totalDjArtists / itemsPerPage),
      totalItems: totalDjArtists,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getDjArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const djArtist = await DjArtist.findOne({ service_id: id });
    if (!djArtist) {
      return res.status(404).json({ message: "DJ Artist not found" });
    }
    res.status(200).json(djArtist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDjArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle file uploads if any
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

    const updatedDjArtist = await DjArtist.findOneAndUpdate(
      { service_id: id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedDjArtist) {
      return res.status(404).json({ message: "DJ Artist not found" });
    }

    // Update section completion
    await updateSectionCompletion(updatedDjArtist.vendor_id);

    res.status(200).json(updatedDjArtist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDjArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDjArtist = await DjArtist.findOneAndDelete({ service_id: id });
    
    if (!deletedDjArtist) {
      return res.status(404).json({ message: "DJ Artist not found" });
    }

    // Remove from vendor services
    const vendor = await Vendor.findOne({ vendor_id: deletedDjArtist.vendor_id });
    if (vendor) {
      vendor.services = vendor.services.filter(serviceId => serviceId !== deletedDjArtist.service_id);
      vendor.service_types = vendor.service_types.filter(service => service.service_id !== deletedDjArtist.service_id);
      await vendor.save();
    }

    res.status(200).json({ message: "DJ Artist deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createDjArtist,
  getAllDjArtists,
  getDjArtistById,
  updateDjArtist,
  deleteDjArtist,
};

export default {
  createDjArtist,
  getAllDjArtists,
  getDjArtistById,
  updateDjArtist,
  deleteDjArtist,
};
