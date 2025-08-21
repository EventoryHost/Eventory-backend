import MakeupArtist from "../../models2/makeupArtist.js";
import { Vendor } from "../../models2/vendor.js";
import { MakeupArtistModel } from "../../models2/reduxModels/makeUpArtist.js";
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

const updateSectionCompletion = async (id) => {
  try {
    console.log("vendorrrrrrrrrrrrrrrrrrrrr", id);
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

const createMakeupArtist = async (req, res) => {
  try {
    console.log("Starting createMakeupArtist function...");
    console.log("Request Body:", req.body);

    // Check if artist already exists
    const alreadyExists = await MakeupArtist.findOne({
      vendor_id: req.body.vendor_id,
    });

    if (alreadyExists) {
      console.log("Error: Makeup artist already exists.");
      return res.status(400).json({ message: "Makeup artist already exists" });
    }

    const service_id = generateUniqueId("MKA");
    console.log("Generated service_id:", service_id);

    const asset_images = req.body.asset_images || [];
    const asset_videos = req.body.asset_videos || [];

    // Find temporary makeup data
    console.log(
      "Searching for tempMakeupData with vendor_id:",
      req.body.vendor_id
    );
    const tempMakeupData = await MakeupArtistModel.findOne({
      vendor_id: req.body.vendor_id,
    });
    console.log("Found tempMakeupData:", tempMakeupData);

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
    console.log(
      "Calculated profile completion score:",
      profile_completion_score
    );

    // Construct the new document
    console.log("Constructing new MakeupArtist document...");
    const newMakeupArtist = new MakeupArtist({
      vendor_id: req.body.vendor_id,
      service_areas: req.body.service_areas || [],
      // ... (nested objects populated from req.body)
      basic_details: {
        is_completed: profile_completion_score?.basic_details || false,
        point_of_contact: req.body.point_of_contact,
        service_contact_number: req.body.service_contact_number,
        min_booking_capacity: req.body.min_booking_capacity,
        max_booking_capacity: req.body.max_booking_capacity,
        description: req.body.description,
        event_types_makeup: req.body.event_types
          ? req.body.event_types.split(",")
          : [],
        types_of_makeup_artists_available: req.body.types_of_makeup_artists
          ? req.body.types_of_makeup_artists.split(",")
          : [],
        service_location_make_up: {
          service_address: req.body.address,
          lat: req.body.latitude,
          lon: req.body.longitude,
          service_pincode: req.body.pincode,
          google_map_link: req.body.location?.google_maps_address || "",
        },
      },
      service_details: {
        is_completed: profile_completion_score?.service_details || false,
        is_onsite_makeup_available: req.body.is_onsite_makeup_available,
        is_customization_possible: req.body.is_customization_possible,
        service_types: req.body.service_types || [],
      },
      additional_details: {
        is_completed: profile_completion_score?.additional_details || false,
        asset_images: asset_images,
        asset_videos: asset_videos,
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
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
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
        bank_name: req.body.bank_name,
        account_type: req.body.account_type,
        account_number: req.body.account_number,
        ifsc: req.body.ifsc,
        service_id: service_id,
        vendor_id: req.body.vendor_id,
      },
      profile_completion_score: profile_completion_score || 0,
    });

    console.log("Attempting to save the new document...");
    const savedMakeupArtist = await newMakeupArtist.save();
    console.log("Successfully saved MakeupArtist document.");

    // Associate with vendor
    console.log("Searching for vendor with vendor_id:", req.body.vendor_id);
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    if (!vendor) {
      console.log(
        "Error: Vendor not found. Deleting new MakeupArtist document."
      );
      await MakeupArtist.findByIdAndDelete(savedMakeupArtist.vendor_id);
      return res.status(404).json({ message: "Vendor not found" });
    }
    console.log("Found vendor:", vendor);

    console.log(`MAKEUP ARTIST ID (Vendor ID): ${savedMakeupArtist.vendor_id}`);
    console.log("Attempting to push document ID into vendor services array...");
    vendor.services.push(savedMakeupArtist.vendor_id); // Changed to push _id, as this is the likely fix
    console.log(
      "Successfully pushed new service ID. Saving vendor document..."
    );
    await vendor.save();
    console.log("Vendor document saved successfully.");

    // Update section completion and profile completion
    console.log("Updating section completion...");
    await updateSectionCompletion(savedMakeupArtist.vendor_id);
    console.log("Section completion updated.");

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
    const makeupArtist = await MakeupArtist.findOne({
      vendor_id: req.params.vendor_id,
    });
    if (!makeupArtist) {
      return res.status(404).json({ message: "Makeup artist not found" });
    }
    res.status(200).json(makeupArtist);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist, getMakeupArtistById };
