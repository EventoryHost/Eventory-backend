import MakeupArtist from "../../models/makeupArtists.js";
import { Vendor } from "../../models/users.js";
import { MakeupArtistModel } from "../../models2/reduxModels/makeupArtist.js";
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
        `❌ Incomplete field: ${key}, Value: ${JSON.stringify(value)}`,
      );
      isComplete = false;
    } else {
      console.log(`✅ Filled field: ${key}`);
    }
  }

  return isComplete;
};

const updateSectionCompletion = async (id) => {
  try {
    const makeupArtist = await MakeupArtist.findOne({ id });
    if (!makeupArtist) throw new Error("Makeup artist not found");

    makeupArtist.basicDetails.completed = checkCompletion(
      makeupArtist.basicDetails,
    );

    makeupArtist.serviceDetails.completed = checkCompletion(
      makeupArtist.serviceDetails,
    );

    makeupArtist.additionalDetails.completed = checkCompletion(
      makeupArtist.additionalDetails,
    );

    makeupArtist.policies.completed = checkCompletion(makeupArtist.policies);

    await makeupArtist.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createMakeupArtist = async (req, res) => {
  try {
    // Check if artist already exists using the correct schema field names
    const alreadyExists = await MakeupArtist.findOne({
      point_of_contact: req.body.name,
      vendorId: req.body.vendor_id, 
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    const service_id = generateUniqueId("MAK");

    const asset_images = req.body.asset_images || [];
    const asset_videos = req.body.asset_videos || [];

    const tempCatererData = await MakeupArtistModel.findOne({
              vendor_id: req.body.vendor_id,
            });
            const agreementUrl = tempCatererData?.agreement_url || " ";
            const agreementSignedAt = tempCatererData?.agreement_signed_at || new Date();
        
            if (agreementUrl) {
              console.log("Found agreement data for venue:", agreementUrl);
            }


    // Determine profile completion
    const fieldsToCheck = [
      // basicDetails fields
      req.body.point_of_contact,
      req.body.service_contact_number,
      req.body.min_booking_capacity,
      req.body.max_booking_capacity,
      req.body.description,
      req.body.event_types_makeup?.length > 0, 
      req.body.types_of_makeup_artists_available?.length > 0, 
      req.body.service_location_makeup_artist?.lat, 
      req.body.service_location_makeup_artist?.lon, 
      req.body.service_location_makeup_artist?.service_pincode, 
      req.body.service_location_makeup_artist?.google_map_link, 

      // serviceDetails fields
      req.body.is_onsite_makeup_available, 
      req.body.is_customization_possible, 
      req.body.service_types?.length > 0,

      // additionalDetails fields
      asset_images.length > 0,
      asset_videos.length > 0, 
      req.body.min_booking_period, 
      req.body.max_booking_period,
      req.body.prices_starts_from,
      req.body.ig_socials_link, // maps to igSocialsLink
      req.body.web_social_link, // maps to webSocialLink

      // policies fields
      req.body.cancellationPolicy,
      req.body.termsAndConditions,

    // Business Details
        req.body.category,
        req.body.business_registration_name,
        req.body.gst,
        req.body.pan || null,
        req.body.verification_type,
        req.body.team_size ,
        req.body.years_of_operation,
        req.body.business_address ,
        req.body.landmark,
        req.body.pincode,
        req.body.operational_cities,
        req.body.annual_revenue,
        req.body.annual_bookings,
        req.body.account_type,
        req.body.vendor_id
  ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profile_completion_score =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    // Construct the new document using the camelCase field names from the schema
    const newMakeupArtist = new MakeupArtist({
    vendor_id: req.body.vendor_id,
    service_areas: req.body.service_areas || [],
    
    basic_details: { 
      is_completed: profile_completion_score?.basic_details || false,
      point_of_contact: req.body.name, 
      service_contact_number: req.body.service_contact_number, 
      min_booking_capacity: req.body.min_booking_capacity,
      max_booking_capacity: req.body.max_booking_capacity,
      description: req.body.description,
      event_types_makeup: req.body.event_types ? req.body.event_types.split(",") : [], 
      types_of_makeup_artists_available: req.body.types_of_makeup_artists ? req.body.types_of_makeup_artists.split(",") : [], 
      service_location_make_up: { 
        service_address: req.body.address, 
        lat: req.body.latitude,
        lon: req.body.longitude,
        service_pincode: req.body.pincode, 
        google_map_link: req.body.location?.google_maps_address || "", to 
      },
    },
    
    service_details: { 
      is_completed: profile_completion_score?.service_details || false,
      is_onsite_makeup_available: req.body.is_onsite_makeup_available,
      is_customization_possible: req.body.is_customization_possible,
      service_types: req.body.service_types ? req.body.service_types.split(",") : [], 
    },
    
    additional_details: { 
      is_completed: profile_completion_score?.additional_details || false,
      asset_images: req.body.photos, 
      asset_videos: req.body.videos, 
      min_booking_period: req.body.min_booking_period,
      max_booking_period: req.body.max_booking_period,
      prices_starts_from: req.body.prices_starts_from,
      ig_socials_link: req.body.ig_socials_link || "",
      web_social_link: req.body.web_social_link || "",
    },

    policies: {
      is_completed: profile_completion_score?.policies || false,
      cancellation_policy: req.body.cancellation_policy,
      terms_and_conditions: req.body.terms_and_conditions,
      agreementUrl,
      agreementSignedAt,
    },

    business_details: {
      is_completed: profile_completion_score?.business_details || false,
      service_id: service_id,
      service_type: req.body.service_type,
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

    profile_completion_score: profile_completion_score || 0,

  });

    const savedMakeupArtist = await newMakeupArtist.save();
    
    // Associate with vendor
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      await Caterer.findByIdAndDelete(savedMakeupArtist.vendor_id);
      return res.status(404).json({ message: "Vendor not found" });
    }
  
    vendor.services.push(
      savedMakeupArtist.vendor_id,
    );
    await vendor.save();
    
    // Update section completion and profile completion
    await updateSectionCompletion(savedMakeupArtist.vendor_id);

    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedMakeupArtist.basic_details.point_of_contact,
        type: savedMakeupArtist.service_type,
      });
    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    console.error(error);
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
    const makeupArtist = await MakeupArtist.findOne({ id: req.params.id });
    if (!makeupArtist) {
      return res.status(404).json({ message: "Makeup artist not found" });
    }
    res.status(200).json(makeupArtist);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist , getMakeupArtistById };
