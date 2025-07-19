import express from "express";
import { Vendor } from "../models/users.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import PropRental from "../models/props.js";
import { Venue } from "../models/venue.js";
import MakeupArtist from "../models/makeupArtists.js";
import DjArtist from "../models/djArtist.js";
import { checkDecoratorProfileCompletion } from "../utils/completionUtils/decoratorCompletionUtils.js";
import { checkCatererProfileCompletion } from "../utils/completionUtils/catererCompletionUtils.js";
import { checkPhotographerProfileCompletion } from "../utils/completionUtils/pavCompletionUtils.js";
import { checkVenueProfileCompletion } from "../utils/completionUtils/venueCompletionUtils.js";
import { checkMakeupArtistProfileCompletion } from "../utils/completionUtils/makeupCompletionUtils.js";
import { checkDjArtistProfileCompletion } from "../utils/completionUtils/djCompletionUtils.js";

const router = express.Router();

//1. Update API for basic vendor details such as name, mobile, email ((Full name and number))
router.put("/update-service/:serviceId", async (req, res) => {
  const { serviceId } = req.params;
  const updateData = req.body;

  console.log(
    `1..API  Data recieved from the frontend is ${JSON.stringify(updateData)}`
  );

  try {
    // Find the vendor containing the specific serviceId
    const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });

    if (!vendor) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update vendor-level fields if provided in the request body
    if (updateData.name) vendor.name = updateData.name;
    if (updateData.mobile) vendor.mobile = updateData.mobile;
    if (updateData.email) vendor.email = updateData.email;
    if (updateData.businessDetails) {
      const fieldsToUpdate = updateData.businessDetails;

      if (fieldsToUpdate.businessName)
        vendor.businessDetails.businessName = fieldsToUpdate.businessName;
      if (fieldsToUpdate.category)
        vendor.businessDetails.category = fieldsToUpdate.category;
      if (fieldsToUpdate.teamsize)
        vendor.businessDetails.teamsize = fieldsToUpdate.teamsize;
      if (fieldsToUpdate.years)
        vendor.businessDetails.years = fieldsToUpdate.years;
      if (fieldsToUpdate.businessAddress)
        vendor.businessDetails.businessAddress = fieldsToUpdate.businessAddress;
      if (fieldsToUpdate.pinCode)
        vendor.businessDetails.pinCode = fieldsToUpdate.pinCode;
      if (fieldsToUpdate.cities)
        vendor.businessDetails.cities = fieldsToUpdate.cities;
      if (fieldsToUpdate.annualrevenue)
        vendor.businessDetails.annualrevenue = fieldsToUpdate.annualrevenue;
      if (fieldsToUpdate.gstin)
        vendor.businessDetails.gstin = fieldsToUpdate.gstin;
      if (fieldsToUpdate.bookingsPerMonth)
        vendor.businessDetails.bookingsPerMonth =
          fieldsToUpdate.bookingsPerMonth;
    }

    // Update the relevant service in the serviceIds array
    vendor.serviceIds = vendor.serviceIds.map((service) => {
      if (service.serId === serviceId) {
        return { ...service, ...updateData }; // Merge with new data
      }
      return service;
    });
    // Update the relevant service in the serviceIds array
    vendor.serviceIds = vendor.serviceIds.map((service) => {
      if (service.serId === serviceId) {
        return { ...service, ...updateData }; // Merge with new data
      }
      return service;
    });

    // Save the updated document
    await vendor.save();

    // Send the response once
    res
      .status(200)
      .json({ message: "Service and vendor updated successfully", vendor });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

//2. API endpoint to update service details (company name and description)
router.post("/updateService/:serviceId", async (req, res) => {
  const { serviceId } = req.params; // Get serviceId from the URL parameter
  const { newDescription, newCompanyName } = req.body; // Get other data from the request body

  try {
    // Fetch the vendor document by serviceId
    const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Find the service details based on the serviceId
    const service = vendor.serviceIds.find(
      (service) => service.serId === serviceId
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Dynamically select the service model based on the serviceType
    let serviceDoc;
    switch (service.serType) {
      case "caterer":
        serviceDoc = await Caterer.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "decorator":
        serviceDoc = await Decorator.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "pav":
      case "photographer": // Replace 'pav' with 'photographer'
        serviceDoc = await Photographer.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "venue-provider":
        serviceDoc = await Venue.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "prop-rental":
        serviceDoc = await PropRental.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "makeupArtist":
        serviceDoc = await MakeupArtist.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      case "djArtist":
        serviceDoc = await DjArtist.findOne({
          id: service.serId,
          venId: vendor.id,
        });
        break;
      default:
        return res.status(400).json({ message: "Invalid service type" });
    }

    if (!serviceDoc) {
      return res
        .status(404)
        .json({ message: `${service.serType} service not found` });
    }

    // Update the service document (e.g., description and company name)
    const updateFields = {
      "basicDetails.description": newDescription,
      "basicDetails.name": newCompanyName,
    };

    // Use findOneAndUpdate to avoid full document validation
    const updatedServiceDoc = await serviceDoc.constructor.findOneAndUpdate(
      { _id: serviceDoc._id },
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    return res
      .status(200)
      .json({
        message: "Service updated successfully",
        data: updatedServiceDoc,
      });
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

//3. API endpoint to update service details
const updateServiceDetails = async (req, res) => {
  const { serId } = req.params;
  const updateData = req.body;

  console.log(
    `3..API  Data recieved from the frontend is ${JSON.stringify(updateData)}`
  );

  try {
    // Step 1: Find the vendor's service type
    const vendor = await Vendor.findOne({ "serviceIds.serId": serId });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor or service not found" });
    }

    const service = vendor.serviceIds.find(
      (service) => service.serId === serId
    );

    const { serType } = service;
    let updatedService;

    // Step 2: Update the respective service based on service type
    switch (serType) {
      case "caterer":
        updatedService = await Caterer.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkCatererProfileCompletion(serId);
        break;
      case "decorator":
        updatedService = await Decorator.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkDecoratorProfileCompletion(serId);
        break;
      case "pav":
        updatedService = await Photographer.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkPhotographerProfileCompletion(serId);
        break;
      case "venue-provider":
        updatedService = await Venue.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkVenueProfileCompletion(serId);
        break;
      case "prop-rental":
        updatedService = await PropRental.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        break;
      case "makeupArtist":
        updatedService = await MakeupArtist.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkMakeupArtistProfileCompletion(serId);
        break;
      case "djArtist":
        updatedService = await DjArtist.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true }
        );
        await checkDjArtistProfileCompletion(serId);
        break;
      default:
        return res.status(400).json({ error: "Unsupported service type" });
    }

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found for update" });
    }

    const isVerified = checkVerification(updatedService, serType);
    console.log(`Verification status for ${serType}: ${isVerified}`);
    await updatedService.updateOne({ isVerified });

    // Step 3: Calculate and update profile completion percentage
    const profileCompletion = calculateProfileCompletion(
      updatedService,
      serType
    );
    await updatedService.updateOne({
      "basicDetails.profileCompletion": profileCompletion,
    });

    return res
      .status(200)
      .json({ message: "Details updated successfully", updatedService });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const serviceFields = {
  caterer: [
    "basicDetails.name",
    "basicDetails.managerName",
    "basicDetails.capacity",
    "basicDetails.description",
    "basicDetails.cuisine_specialities",
    "basicDetails.regional_specialities",
    "basicDetails.service_style_offered",
    "menuDetails.menu",
    "menuDetails.vegOrNonVeg",
    "menuDetails.pre_set_menus",
    "menuDetails.customizable",
    "eventDetails.event_types_catered",
    "eventDetails.additional_services",
    "staffAndEquipmentDetails.staff_provided",
    "additionalDetails.minimum_order_requirements",
    "additionalDetails.advance_booking_period",
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.tasting_sessions",
    "additionalDetails.business_licenses",
    "additionalDetails.food_safety_certificates",
    "additionalDetails.priceStartingFrom",
    "policies.cancellationPolicy",
    "policies.termsAndConditions",
  ],
  decorator: [
    "basicDetails.name",
    "basicDetails.eventSize",
    "basicDetails.description",
    "basicDetails.eventTypes.types",
    "themesOffered",
    "themesOffered.colorSchemeAssistance",
    "themesOffered.venueAdaptability",
    "themesOffered.themeCustomization",
    "themesElement.themeElements",
    "themesElement.themePhotos",
    "themesElement.themeVideos",
    "additionalDetails.priceStartingFrom",
    "additionalDetails.advanceBookingPeriod",
    "additionalDetails.themeProposels",
    "additionalDetails.proposalRevisions",
    "policies.cancellationPolicy",
    "policies.termsAndConditions",
  ],
  djArtist: [
    "basicDetails.name",
    "basicDetails.contact",
    "basicDetails.description",
    "serviceDetails.eventTypes",
    "serviceDetails.musicGenres",
    "serviceDetails.regionalSpecializations",
    "serviceDetails.servicesOffered",
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.awards",
    "additionalDetails.instagramUrl",
    "additionalDetails.websiteUrl",
    "additionalDetails.testimonials",
    "additionalDetails.priceStarts",
    "policies.termsAndConditions",
    "policies.cancellationPolicy",
  ],
  makeupArtist: [
    "basicDetails.name",
    "basicDetails.eventSize",
    "basicDetails.description",
    "basicDetails.eventTypes",
    "basicDetails.typesOfMakeupArtists",

    "serviceDetails.onsiteMakeup",
    "serviceDetails.customization",
    "serviceDetails.serviceTypes",

    "additionalDetails.photos",
    "policies.termsAndConditions",
    "policies.cancellationPolicy",
  ],

  pav: [
    "basicDetails.name",
    "basicDetails.eventSize",
    "basicDetails.description",
    "basicDetails.eventTypes",
    "additionalDetails.priceStartingFrom",
    "Photography.typesOfStyles",
    "Photography.equipmentAvailable",
    "Photography.addonsOrUpgradeAvailable",
    "Photography.finalDeliveryMethods",
    "Videography.typesOfStyles",
    "Videography.equipmentAvailable",
    "Videography.addonsOrUpgradeAvailable",
    "Videography.finalDeliveryMethods",
    "consultationDetails.freeInitialConsultation",
    "consultationDetails.bookingDeposit",
    "consultationDetails.proposalsToClients",
    "consultationDetails.postProductionServices",
    "consultationDetails.availableForDestinationEvents",
    "consultationDetails.AdvanceSetup",
    "policies.termsAndConditions",
    "policies.cancellationPolicy",
    "additionalDetails.photos",
    "additionalDetails.videos",
  ],

  "venue-provider": [
    "basicDetails.name",
    "basicDetails.capacity",
    "additionalDetails.priceStartingFrom",
    "featureDetails.venueTypes",
    "featureDetails.accessibilityFeatures",
    "featureDetails.restrictionsPolicies",
    "featureDetails.facilities",
    "featureDetails.catererServices",
    "featureDetails.decorServices",
    "additionalDetails.advanceBookingPeriod",
    "policies.termsAndConditions",
    "policies.cancellationPolicy",
    "additionalDetails.photos",
    "additionalDetails.videos",
  ],
};

// Define the route to update service details
router.put("/updateService/:serId", updateServiceDetails);

const calculateProfileCompletion = (serviceData, serviceType) => {
  console.log(`Calculating profile completion for ${serviceType} service...`);
  const requiredFields = serviceFields[serviceType];
  if (!requiredFields) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  let filledFields = 0;

  requiredFields.forEach((field) => {
    const fieldPath = field.split("."); // Split by '.' to handle nested fields
    let currentValue = serviceData;

    // Traverse through the field path
    for (let key of fieldPath) {
      if (currentValue[key] !== undefined && currentValue[key] !== null) {
        currentValue = currentValue[key];
      } else {
        console.log(`Field ${field} ❌`);
        return; // Field is not filled, exit early
      }
    }

    // Check if the final value is filled (non-empty string or non-null)
    if (currentValue?.toString().trim()) {
      filledFields += 1;
      console.log(`Field ${field} ✅`);
    } else {
      console.log(`Field ${field} ❌`);
    }
  });

  const completionPercentage = (filledFields / requiredFields.length) * 100;
  console.log(`Profile completion: ${completionPercentage}%`);
  return Math.round(completionPercentage);
};

// Helper function to check verification criteria (Checkers)
const checkVerification = (service, serType) => {
  console.log(`Checking verification for ${serType} service...`);
  let allFieldsValid = true;

  let fieldsToCheck = [];

  switch (serType) {
    case "caterer":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Business Name" },
        { path: "basicDetails.managerName", label: "Manager Name" },
        { path: "basicDetails.capacity", label: "Serving Capacity" },
        { path: "basicDetails.description", label: "Description" },
        {
          path: "basicDetails.cuisine_specialities",
          label: "Cuisine Specialities",
        },
        {
          path: "basicDetails.regional_specialities",
          label: "Regional Specialities",
        },
        {
          path: "basicDetails.service_style_offered",
          label: "Service Style Offered",
        },
        { path: "menuDetails.menu", label: "Menu" },
        {
          path: "menuDetails.vegOrNonVeg",
          label: "Vegetarian or Non-Vegetarian",
        },
        { path: "menuDetails.pre_set_menus", label: "Pre-set Menus" },
        { path: "menuDetails.customizable", label: "Customizable Menu" },
        {
          path: "eventDetails.event_types_catered",
          label: "Event Types Catered",
        },
        {
          path: "eventDetails.additional_services",
          label: "Additional Services",
        },
        {
          path: "staffAndEquipmentDetails.staff_provided",
          label: "Staff Provided",
        },
        {
          path: "additionalDetails.minimum_order_requirements",
          label: "Minimum Order Requirements",
        },
        {
          path: "additionalDetails.advance_booking_period",
          label: "Advance Booking Period",
        },
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "additionalDetails.videos", label: "Videos" },
        {
          path: "additionalDetails.tasting_sessions",
          label: "Tasting Sessions",
        },
        {
          path: "additionalDetails.business_licenses",
          label: "Business Licenses",
        },
        {
          path: "additionalDetails.food_safety_certificates",
          label: "Food Safety Certificates",
        },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
      ];
      break;
    case "decorator":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Service Name" },
        { path: "basicDetails.eventSize", label: "Event Size" },
        { path: "basicDetails.description", label: "Description" },
        { path: "basicDetails.eventTypes.types", label: "Types of Events" },
        { path: "themesOffered", label: "Themes Offered" },
        {
          path: "themesOffered.colorSchemeAssistance",
          label: "Color Scheme Assistance",
        },
        {
          path: "themesOffered.venueAdaptability",
          label: "Venue Adaptability",
        },
        {
          path: "themesOffered.themeCustomization",
          label: "Theme Customization",
        },
        { path: "themesElement.themeElements", label: "Theme Elements" },
        { path: "themesElement.themePhotos", label: "Theme Photos" },
        { path: "themesElement.themeVideos", label: "Theme Videos" },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        {
          path: "additionalDetails.advanceBookingPeriod",
          label: "Advance Booking Period",
        },
        {
          path: "additionalDetails.themeProposels",
          label: "Theme Proposals",
        },
        {
          path: "additionalDetails.proposalRevisions",
          label: "Proposal Revisions",
        },
        { path: "additionalDetails.photos", label: "Additional Photos" },
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },
      ];
      break;
    case "pav":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Business Name" },
        { path: "basicDetails.eventSize", label: "Event Size" },
        { path: "basicDetails.description", label: "Description" },
        { path: "basicDetails.eventTypes", label: "Event Types" },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        { path: "Photography.typesOfStyles", label: "Photography Styles" },
        {
          path: "Photography.equipmentAvailable",
          label: "Photography Equipment Available",
        },
        {
          path: "Photography.addonsOrUpgradeAvailable",
          label: "Photography Add-ons or Upgrades",
        },
        {
          path: "Photography.finalDeliveryMethods",
          label: "Photography Final Delivery Methods",
        },
        { path: "Videography.typesOfStyles", label: "Videography Styles" },
        {
          path: "Videography.equipmentAvailable",
          label: "Videography Equipment Available",
        },
        {
          path: "Videography.addonsOrUpgradeAvailable",
          label: "Videography Add-ons or Upgrades",
        },
        {
          path: "Videography.finalDeliveryMethods",
          label: "Videography Final Delivery Methods",
        },
        {
          path: "consultationDetails.freeInitialConsultation",
          label: "Free Initial Consultation",
        },
        {
          path: "consultationDetails.bookingDeposit",
          label: "Booking Deposit",
        },
        {
          path: "consultationDetails.proposalsToClients",
          label: "Proposals to Clients",
        },
        {
          path: "consultationDetails.postProductionServices",
          label: "Post-production Services",
        },
        {
          path: "consultationDetails.availableForDestinationEvents",
          label: "Available for Destination Events",
        },
        { path: "consultationDetails.AdvanceSetup", label: "Advance Setup" },
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "additionalDetails.videos", label: "Videos" },
      ];
      break;
    case "venue-provider":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Venue Name" },
        { path: "basicDetails.capacity", label: "Venue Capacity" },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        { path: "featureDetails.venueTypes", label: "Venue Types" },
        {
          path: "featureDetails.accessibilityFeatures",
          label: "Accessibility Features",
        },
        {
          path: "featureDetails.restrictionsPolicies",
          label: "Restrictions and Policies",
        },
        { path: "featureDetails.facilities", label: "Facilities" },
        {
          path: "featureDetails.catererServices",
          label: "Catering Services Available",
        },
        {
          path: "featureDetails.decorServices",
          label: "Decoration Services Available",
        },
        {
          path: "additionalDetails.advanceBookingPeriod",
          label: "Advance Booking Period",
        },
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "additionalDetails.videos", label: "Videos" },
      ];
      break;
    // Add criteria for other service types as needed

    default:
      console.log(`Unknown service type: ${serType}`);
      return false;
  }
  fieldsToCheck.forEach(({ path, label }) => {
    const fieldPath = path.split(".");
    let currentValue = service;

    for (let key of fieldPath) {
      if (currentValue[key] !== undefined && currentValue[key] !== null) {
        currentValue = currentValue[key];
      } else {
        console.log(`Field "${label}" (${path}) XXXXXXX`);
        allFieldsValid = false;
        return; // Field is not valid, exit early
      }
    }

    if (currentValue?.toString().trim()) {
      console.log(`Field "${label}" (${path}) OK`);
    } else {
      console.log(`Field "${label}" (${path}) XXXXXXX`);
      allFieldsValid = false;
    }
  });

  return allFieldsValid;
};

export default router;
