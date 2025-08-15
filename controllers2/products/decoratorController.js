import { set } from "mongoose";
import { Decorator } from "../../models2/decorator.js";
// import { DecoratorModel } from "../../models2/reduxStores/decorator.js";
import { Vendor } from "../../models2/vendor.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";

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

const updateSectionCompletion = async (id) => {
  try {
    const decorator = await Decorator.findOne({ id });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    decorator.basicDetails.completed = checkCompletion(
      decorator.basicDetails || {},
    );
    decorator.serviceDetails.completed = checkCompletion(
      decorator.serviceDetails || {},
    );
    // decorator.themesOffered.completed = checkCompletion(
    //   decorator.themesOffered || {},
    // );
    // decorator.themesElement.completed = checkCompletion(
    //   decorator.themesElement || {},
    // );
    decorator.additionalDetails.completed = checkCompletion(
      decorator.additionalDetails || {},
    );
    decorator.policies.completed = checkCompletion(decorator.policies || {});

    await decorator.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createDecorator = async (req, res) => {
  try {
    const {
      vendor_id,
      point_of_contact,
      business_details,
      bank_details,
      service_type,
      service_areas,
      ...restOfBody
    } = req.body;

    // Check for existing decorator using the correct schema fields
    const alreadyExists = await Decorator.findOne({
      vendor_id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Decorator already exists" });
    }

    const service_id = generateUniqueId("DECO");

    // Fetch agreement data from a temporary model if needed, otherwise use request body.
    let agreementUrl = restOfBody.agreement_url || null;
    let agreementSignedAt = restOfBody.agreement_signed_at
      ? new Date(restOfBody.agreement_signed_at)
      : null;

    // Build the new Decorator document with data mapped to the new schema structure
    const newDecorator = new Decorator({
      vendor_id: vendor_id,
      service_id: service_id,
      service_type: service_type || "Decorator",
      service_areas: service_areas || [],
      
      basic_details: {
        point_of_contact: point_of_contact,
        service_contact_number: restOfBody.service_contact_number,
        avg_setup_duration: restOfBody.avg_setup_duration,
        description: restOfBody.description,
        event_types_decorated: restOfBody.event_types_decorated || [],
        service_location_decorator: {
          lat: restOfBody.lat,
          lon: restOfBody.lon,
          service_pincode: restOfBody.service_pincode,
          google_map_link: restOfBody.google_map_link,
        },
      },
      theme_details: {
        themes_offered: restOfBody.themes_offered || [],
        is_prop_selection_available: restOfBody.is_prop_selection_available,
        any_custom_design_process: restOfBody.any_custom_design_process,
        is_colour_scheme_assistance_provided: restOfBody.is_colour_scheme_assistance_provided,
        is_theme_customization_allowed: restOfBody.is_theme_customization_allowed,
        is_venue_adaptability: restOfBody.is_venue_adaptability,
        theme_elements_available: restOfBody.theme_elements_available || [],
        theme_portfolio_images: restOfBody.theme_portfolio_images || [],
        theme_portfolio_videos: restOfBody.theme_portfolio_videos || [],
      },
      additional_details: {
        asset_images: restOfBody.asset_images || [],
        asset_videos: restOfBody.asset_videos || [],
        min_booking_period: restOfBody.min_booking_period,
        max_booking_period: restOfBody.max_booking_period,
        prices_starts_from: restOfBody.prices_starts_from,
        ig_socials_link: restOfBody.ig_socials_link,
        web_social_link: restOfBody.web_social_link,
        is_theme_proposals_provided: restOfBody.is_theme_proposals_provided,
        is_proposal_revision_possible: restOfBody.is_proposal_revision_possible,
      },
      policies: {
        cancellation_policy: restOfBody.cancellation_policy,
        terms_and_conditions: restOfBody.terms_and_conditions,
        agreement_url: agreementUrl,
        agreement_signed_at: agreementSignedAt,
      },
      business_details: business_details,
      bank_details: bank_details,
    });

    const savedDecorator = await newDecorator.save();

    // Associate with vendor
    const vendor = await Vendor.findOne({ id: vendor_id });
    if (!vendor) {
      await Decorator.findByIdAndDelete(savedDecorator._id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Add the new service ID to the vendor's services array
    vendor.serviceIds.push({
      serType: "decorator",
      serId: savedDecorator.service_id,
    });
    await vendor.save();

    // Update section completion
    await updateSectionCompletion(vendor_id);

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

export default { createDecorator, getAllDecorators };
