import { set } from "mongoose";
import { Decorator } from "../../models2/decorator.js";
// import { DecoratorModel } from "../../models2/reduxStores/decorator.js";
import { Vendor } from "../../models2/vendor.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";
import generateUniqueId from "../../utils/generateId2.js";
import { ReduxDecoratorModel } from "../../models2/reduxModels/decorator.js";

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

    decorator.policies.is_completed = checkCompletion(
      decorator.policies || {}
    );

    decorator.business_details.is_completed = checkCompletion(
      decorator.business_details || {}
    );

    await decorator.save();
  } catch (error) {
    console.error("Error in updateSectionCompletion:", error);
    throw error;
  }
};

const createDecorator = async (req, res) => {
  try {
    // Check for existing decorator
    const alreadyExists = await Decorator.findOne({
      vendor_id: req.body.vendor_id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Decorator already exists" });
    }

    const service_id = generateUniqueId("DECO");

    const tempVenueData = await ReduxDecoratorModel.findOne({
      vendor_id: req.body.vendor_id,
    });
    const agreementUrl = tempVenueData?.agreement_url || " ";
    const agreementSignedAt = tempVenueData?.agreement_signed_at || new Date();

    if (agreementUrl) {
      console.log("Found agreement data for venue:", agreementUrl);
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

    // -------------------------------
    // Create new decorator document
    // -------------------------------
    const newDecorator = new Decorator({
      vendor_id: req.body.vendor_id,
      service_id: service_id,
      service_type: req.body.service_type || "Decorator",
      service_areas: req.body.service_areas || [],

      basic_details: {
        is_completed: profile_completion_score?.basic_details || false,
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
        is_completed: profile_completion_score?.theme_details || false,
        themes_offered: req.body.themes_offered || [],
        is_prop_selection_available: req.body.is_prop_selection_available,
        any_custom_design_process: req.body.any_custom_design_process,
        is_colour_scheme_assistance_provided:
          req.body.is_colour_scheme_assistance_provided,
        is_theme_customization_allowed: req.body.is_theme_customization_allowed,
        is_venue_adaptability: req.body.is_venue_adaptability,
        theme_elements_available: req.body.theme_elements_available || [],
        theme_portfolio_images: req.body.theme_portfolio_images || [],
        theme_portfolio_videos: req.body.theme_portfolio_videos || [],
      },

      additional_details: {
        is_completed: profile_completion_score?.additional_details || false,
        asset_images: req.body.asset_images || [],
        asset_videos: req.body.asset_videos || [],
        min_booking_period: req.body.min_booking_period,
        max_booking_period: req.body.max_booking_period,
        prices_starts_from: req.body.prices_starts_from,
        ig_socials_link: req.body.ig_socials_link,
        web_social_link: req.body.web_social_link,
        is_theme_proposals_provided: req.body.is_theme_proposals_provided,
        is_proposal_revision_possible: req.body.is_proposal_revision_possible,
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
        account_type: req.body.account_type,
        service_id: service_id,
        vendor_id: req.body.vendor_id
      },

      profile_completion_score: profile_completion_score || 0,
    });

    const savedDecorator = await newDecorator.save();

    // Vendor association
    console.log("Vendor ID", req.body.vendor_id);
    const vendor = await Vendor.findOne({ vendor_id: req.body.vendor_id });
    console.log("Vendor", vendor);
    if (!vendor) {
      await Decorator.findByIdAndDelete(savedDecorator._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.services.push(savedDecorator.service_id);
     vendor.service_types.push({
      "service_name" : "Decorator",
      "service_status" : "Inactive",
      "service_id" : savedDecorator.service_id
    })
    await vendor.save();

    // Update section completion
    await updateSectionCompletion(savedDecorator.vendor_id);

    process.env.IS_DEV !== "true" &&
      sendEmailToSlack({
        name: savedDecorator.basic_details.point_of_contact,
        type: savedDecorator.service_type,
      });

    res.status(201).json(savedDecorator);
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

    const decorators = await Decorator.find().skip(skip).limit(itemsPerPage);

    const totaldecorators = await Decorator.countDocuments();

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
