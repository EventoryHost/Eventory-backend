import { Caterer } from "../../models2/caterer.js";
import { ReduxCatererModel } from "../../models2/reduxModels/caterer.js";
import { Vendor } from "../../models2/vendor.js";

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
      caterer.basic_details || {}
    );
    // caterer.menu_details.is_completed = checkCompletion(
    //   caterer.menu_details || {}
    // );
    caterer.event_details.is_completed = checkCompletion(
      caterer.event_details || {}
    );
    caterer.additional_details.is_completed = checkCompletion(
      caterer.additional_details || {}
    );
    caterer.policies.is_completed = checkCompletion(caterer.policies || {});
    caterer.business_details.is_completed = checkCompletion(
      caterer.business_details || {}
    );

    await caterer.save();
  } catch (error) {
    console.error("Error in updateSectionCompletion:", error);
    throw error;
  }
};

const createCaterer = async (req, res) => {
  try {
    //ser1: Ankit caterer
    //ser2: ankit caterer
    const alreadyExists = await Caterer.findOne({
      point_of_contact: req.body.point_of_contact,
      vendor_id: req.body.vendor_id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Caterer already exists" });
    }


    // Handle file uploads and array conversions
    const menu = req.body.menu || [];
    const asset_images = req.body.asset_images || [];
    const asset_videos = req.body.asset_videos || [];
    const food_safety_certificates = req.body.food_safety_certificates || [];

    const tempCatererData = await ReduxCatererModel.findOne({
          vendor_id: req.body.vendor_id,
        });
        const agreementUrl = tempCatererData?.agreement_url || " ";
      const agreementSignedAt = tempCatererData?.agreement_signed_at || new Date();
    
        if (agreementUrl) {
          console.log("Found agreement data for venue:", agreementUrl);
        }
    

    // Profile completion check
    const fieldsToCheck = [
      req.body.point_of_contact, // required
      req.body.service_contact_number, // required
      req.body.min_booking_capacity, // required
      req.body.max_booking_capacity, // required
      req.body.description, // required
      req.body.cuisine_specialities?.length > 0, // required array
      req.body.regional_specialities?.length > 0, // required array
      req.body.service_style_offered?.length > 0, // required array
      req.body.service_location_caterer?.lat, // lat (optional but part of object)
      req.body.service_location_caterer?.lon, // lon
      req.body.service_location_caterer?.service_pincode, // 6-digit number
      req.body.service_location_caterer?.google_map_link, // map link

      // Menu Details
      req.body.veg_or_nonveg, // enum: VEG/NON-VEG/BOTH
      menu.length > 0 ||
        (req.body.appetizers?.length > 0 &&
          req.body.beverages?.length > 0 &&
          req.body.main_course?.length > 0),
      req.body.special_dietary_options?.length > 0,
      req.body.menu_customizable, // boolean

      // Event Details
      req.body.event_types_catered?.length > 0, // required array
      req.body.additional_services_for_any_event?.length > 0,
      req.body.staff_provided?.length > 0, // required array
      req.body.equipment_provided?.length > 0,

      // Additional Details
      req.body.min_booking_period, // required number
      req.body.max_booking_period,
      asset_images.length > 0, // required array
      asset_videos.length > 0, // required array
      req.body.is_tasting_session_provided, // required boolean
      req.body.is_business_license_available, // boolean
      food_safety_certificates.length > 0,
      req.body.prices_starts_from, // required number

      // Policies
      req.body.cancellation_policy, // string
      req.body.terms_and_conditions, // string

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

    try {
      const tempCateringData = await Caterer.findOne({
        vendor_id: req.body.vendor_id,
      });
      if (tempCateringData && tempCateringData.agreementUrl) {
        agreementUrl = tempCateringData.agreementUrl;
        agreementSignedAt = tempCateringData.agreementSignedAt;
        console.log("Found agreement data in temp catering:", {
          agreementUrl,
          agreementSignedAt,
        });
      }
    } catch (tempDataError) {
      console.warn(
        "Could not fetch agreement data from temporary catering:",
        tempDataError.message
      );
    }

    const service_id = generateUniqueId("CAT");

    // Create new caterer document
    const newCaterer = new Caterer({
      vendor_id: req.body.vendor_id,
      service_areas: req.body.service_areas || [],
    
      basic_details: {
        is_completed: profile_completion_score?.basic_details || false,
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
          lat: req.body.latitude,
          lon: req.body.longitude,
          service_pincode: parseInt(req.body.pincode, 10),
          google_map_link: req.body.google_map_link,
        },
      },
    
      event_details: {
        is_completed: profile_completion_score?.event_details || false,
        event_types_catered: req.body.event_types_catered || [],
        additional_services_for_any_event: req.body.additional_services_for_any_event || [],
        staff_provided: req.body.staff_provided || [],
        equipment_provided: req.body.equipment_provided || [],
        menu: Array.isArray(req.body.menu) ? req.body.menu : [req.body.menu].filter(Boolean),
        veg_or_nonveg: req.body.veg_or_nonveg,
        appetizers: req.body.appetizers || [],
        main_course: req.body.main_course || [],
        beverages: req.body.beverages || [],
        special_dietary_options: req.body.special_dietary_options || [],
        pre_set_menus: req.body.pre_set_menus || [],
        menu_customizable:
          req.body.menu_customizable === "true" || req.body.menu_customizable === true,
      },
    
      additional_details: {
        is_completed: profile_completion_score?.additional_details || false,
        min_booking_period: parseInt(req.body.min_booking_period, 10),
        max_booking_period: parseInt(req.body.max_booking_period, 10) || undefined,
        asset_images: Array.isArray(req.body.asset_images)
          ? req.body.asset_images
          : [req.body.asset_images].filter(Boolean),
        asset_videos: Array.isArray(req.body.asset_videos)
          ? req.body.asset_videos
          : [req.body.asset_videos].filter(Boolean),
        is_tasting_session_provided:
          req.body.is_tasting_session_provided === "true" ||
          req.body.is_tasting_session_provided === true,
        is_business_license_available:
          req.body.is_business_license_available === "true" ||
          req.body.is_business_license_available === true,
        food_safety_certificates: Array.isArray(req.body.food_safety_certificates)
          ? req.body.food_safety_certificates
          : [req.body.food_safety_certificates].filter(Boolean),
        prices_starts_from: parseInt(req.body.prices_starts_from, 10),
      },
    
      policies: {
        is_completed: profile_completion_score?.policies || false,
        cancellation_policy: req.body.cancellation_policy,
        terms_and_conditions: req.body.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt
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
        vendor_id: req.body.vendor_id
      },
    
      profile_completion_score: profile_completion_score || 0,
    });
    
    const savedCaterer = await newCaterer.save();

    // Associate with vendor
    const vendor = await Vendor.findOne({ vendor_id: req.body.venId });
    if (!vendor) {
      await Caterer.findByIdAndDelete(savedCaterer.vendor_id);
      return res.status(404).json({ message: "Vendor not found" });
    }

  
    vendor.services.push(
      savedCaterer.vendor_id,
    );
    await vendor.save();
    
    // Update section completion and profile completion
    await updateSectionCompletion(savedCaterer.vendor_id);

    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedCaterer.basic_details.point_of_contact,
        type: savedCaterer.service_type,
      });
    res.status(201).json(savedCaterer);
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

    const caterers = await Caterer.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await Caterer.countDocuments();

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

export default { createCaterer, getAllCaterers };
