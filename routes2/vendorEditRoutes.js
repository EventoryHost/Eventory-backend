import express from "express";
import { Vendor } from "../models2/vendor.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import Photographer from "../models2/photographerVideographer.js";
import PropRental from "../models/props.js";
import  VenueProvider  from "../models2/venueProvider.js";
import MakeupArtist from "../models2/makeupArtist.js";
import DjArtist from "../models/djArtist.js";
import { checkDecoratorProfileCompletion } from "../utils/completionUtils/decoratorCompletionUtils.js";
import { checkCatererProfileCompletion } from "../utils/completionUtils/catererCompletionUtils.js";
import { checkPhotographerProfileCompletion } from "../utils/completionUtils/pavCompletionUtils.js";
import { checkVenueProfileCompletion } from "../utils/completionUtils/venueCompletionUtils.js";
import { checkMakeupArtistProfileCompletion } from "../utils/completionUtils/makeupCompletionUtils.js";
import { checkDjArtistProfileCompletion } from "../utils/completionUtils/djCompletionUtils.js";

import {
  updateVendorAndService,
  updateDetails,
} from "../controllers2/vendorEditController.js";

const router = express.Router();

/**
 * @swagger
 * /update-service/{serviceId}:
 *   put:
 *     summary: Update basic vendor and service details
 *     description: Updates vendor-level details (name, mobile, email, business details) and the specified service details for the given serviceId.
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               businessDetails:
 *                 type: object
 *                 properties:
 *                   businessName: { type: string }
 *                   category: { type: string }
 *                   teamsize: { type: number }
 *                   years: { type: number }
 *                   businessAddress: { type: string }
 *                   pinCode: { type: string }
 *                   cities: { type: array, items: { type: string } }
 *                   annualrevenue: { type: number }
 *                   gstin: { type: string }
 *                   bookingsPerMonth: { type: number }
 *     responses:
 *       200:
 *         description: Vendor and service updated successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */

// 1. Update API for basic vendor + service details
router.put("/update-service/:serviceId", updateVendorAndService);

// 2. Update service details (company name and description)
router.post("/updateService/:serviceId", updateDetails);

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

/**
 * @swagger
 * /updateService/{serId}:
 *   put:
 *     summary: Update full service details
 *     description: Updates a service's details for any supported service type and recalculates profile completion and verification.
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serId
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Service fields to update (varies per service type)
 *     responses:
 *       200:
 *         description: Service details updated successfully
 *       400:
 *         description: Unsupported service type
 *       404:
 *         description: Vendor or service not found
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /add-vendor-invoice:
 *   post:
 *     summary: Add an invoice to a vendor
 *     description: Associates an invoice URL with a vendor by their vendorId.
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceUrl:
 *                 type: string
 *               vendorId:
 *                 type: string
 *             required:
 *               - invoiceUrl
 *               - vendorId
 *     responses:
 *       200:
 *         description: Invoice added successfully
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Internal server error
 */

router.post("/add-vendor-invoice", async (req, res) => {
  const { invoiceUrl, vendorId } = req.body;
  console.log(
    `Received request to add invoice for vendor ${vendorId} with URL ${invoiceUrl}`
  );

  const vendor = await Vendor.findOne({ id: vendorId });
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  try {
    vendor.invoices.push(invoiceUrl);
    await vendor.save();
    return res.status(200).json({
      message: "Invoice added successfully",
    });
  } catch (error) {
    console.error("Error adding invoice:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

export default router;
