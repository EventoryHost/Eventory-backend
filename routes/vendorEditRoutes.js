import express from "express";
import { Vendor } from "../models/users.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import PropRental from "../models/props.js";
import { Venue } from "../models/venue.js";
import MakeupArtist from "../models/makeupArtists.js";
import { checkDecoratorProfileCompletion } from "../utils/completionUtils/decoratorCompletionUtils.js";
import { checkCatererProfileCompletion } from "../utils/completionUtils/catererCompletionUtils.js";
import { checkPhotographerProfileCompletion } from "../utils/completionUtils/pavCompletionUtils.js";
import { checkVenueProfileCompletion } from "../utils/completionUtils/venueCompletionUtils.js";
import { checkMakeupArtistProfileCompletion } from "../utils/completionUtils/makeupCompletionUtils.js";

const router = express.Router();

// Update API for basic vendor details such as name, mobile, email ((Full name and number))
router.put("/update-service/:serviceId", async (req, res) => {
  const { serviceId } = req.params;
  const updateData = req.body;

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

// API endpoint to update service details (company name and description)
router.post("/updateService/:serviceId", async (req, res) => {
  const { serviceId } = req.params; // Get serviceId from the URL parameter
  const { newDescription, newCompanyName } = req.body; // Get other data from the request body

  try {
    // Fetch the vendor document by serviceId
    const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });
    try {
      // Fetch the vendor document by serviceId
      const vendor = await Vendor.findOne({ "serviceIds.serId": serviceId });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Find the service details based on the serviceId
      const service = vendor.serviceIds.find(
        (service) => service.serId === serviceId,
      );

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
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
        default:
          return res.status(400).json({ message: "Invalid service type" });
      }

      if (!serviceDoc) {
        return res
          .status(404)
          .json({ message: `${service.serType} service not found` });
      }

      // Update the service document (e.g., description and company name)
      serviceDoc.basicDetails.description = newDescription;
      serviceDoc.basicDetails.name = newCompanyName;

      // Save the updated document
      await serviceDoc.save();

      return res
        .status(200)
        .json({ message: "Service updated successfully", data: serviceDoc });
    } catch (error) {
      console.error("Error updating service:", error);
      return res.status(500).json({ message: "Server error" });
    }
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to update service details
const updateServiceDetails = async (req, res) => {
  const { serId } = req.params;
  const updateData = req.body;

  try {
    // Step 1: Find the vendor's service type
    const vendor = await Vendor.findOne({ "serviceIds.serId": serId });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor or service not found" });
    }

    const service = vendor.serviceIds.find(
      (service) => service.serId === serId,
    );
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const { serType } = service;
    let updatedService;

    // Step 2: Update the respective service based on service type
    switch (serType) {
      case "caterer":
        updatedService = await Caterer.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        await checkCatererProfileCompletion(serId);
        break;
      case "decorator":
        updatedService = await Decorator.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        await checkDecoratorProfileCompletion(serId);
        break;
      case "pav":
        updatedService = await Photographer.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        await checkPhotographerProfileCompletion(serId);
        break;
      case "venue-provider":
        updatedService = await Venue.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        await checkVenueProfileCompletion(serId);
        break;
      case "prop-rental":
        updatedService = await PropRental.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        break;
      case "makeupArtist":
        updatedService = await MakeupArtist.findOneAndUpdate(
          { id: serId },
          { $set: updateData },
          { new: true },
        );
        await checkMakeupArtistProfileCompletion(serId);
        break;
      default:
        return res.status(400).json({ error: "Unsupported service type" });
    }

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found for update" });
    }

    const isVerified = checkVerification(updatedService, serType);
    await updatedService.updateOne({ isVerified });

    // Step 3: Calculate and update profile completion percentage
    const profileCompletion = calculateProfileCompletion(
      updatedService,
      serType,
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
    "menuDetails.appetizers",
    "menuDetails.main_course",
    "menuDetails.beverages",
    "menuDetails.special_dietary_options",
    "menuDetails.pre_set_menus",
    "menuDetails.customizable",
    "eventDetails.event_types_catered",
    "eventDetails.additional_services",
    "staffAndEquipmentDetails.staff_provided",
    "staffAndEquipmentDetails.equipment_provided",
    "additionalDetails.minimum_order_requirements",
    "additionalDetails.advance_booking_period",
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.tasting_sessions",
    "additionalDetails.business_licenses",
    "additionalDetails.food_safety_certificates",
    "additionalDetails.priceStartingFrom",
    "policies.cancellation_policy",
    "policies.terms_and_conditions",
    "policies.client_testimonials",
  ],
  decorator: [
    "basicDetails.name",
    "basicDetails.description",
    "basicDetails.eventSize",
    "basicDetails.duration",
    "themesOffered.themesOffered",
    "themesOffered.customDesignProcess",
    "themesElement.themeElements",
    "themesElement.themePhotos",
    "themesElement.themeVideos",
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.clientTestimonials",
    "additionalDetails.awards",
    "additionalDetails.website",
    "additionalDetails.instagram",
    "additionalDetails.advanceBookingPeriod",
    "additionalDetails.priceStartingFrom",
    "additionalDetails.themeProposels",
    "additionalDetails.proposalRevisions",
    "policies.cancellationPolicy",
    "policies.termsAndConditions",
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
    "additionalDetails.videos",
    "additionalDetails.socialMedia",
    "additionalDetails.websiteUrl",
    "additionalDetails.priceStarts",

    "policies.termsAndConditions",
    "policies.cancellationPolicy",
    "policies.certificateOrAwards",
    "policies.clientTestimonials",
  ],
  pav: [
    "basicDetails.name",
    "basicDetails.description",
    "basicDetails.eventSize",
    "basicDetails.eventTypes",
    "Videography.equipmentAvailable",
    "Videography.typesOfStyles",
    "Videography.addonsOrUpgradeAvailable",
    "Videography.finalDeliveryMethods",
    "Photography.equipmentAvailable",
    "Photography.typesOfStyles",
    "Photography.addonsOrUpgradeAvailable",
    "Photography.finalDeliveryMethods",
    "consultationDetails.duration",
    "consultationDetails.PackageTypes",
    "consultationDetails.proposalsToClients",
    "consultationDetails.freeInitialConsultation",
    "consultationDetails.bookingDeposit",
    "consultationDetails.availableForDestinationEvents",
    "consultationDetails.AdvanceSetup",
    "consultationDetails.postProductionServices",
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.clientTestimonials",
    "additionalDetails.awards",
    "additionalDetails.website",
    "additionalDetails.instagram",
    "additionalDetails.priceStartingFrom",
    "policies.cancellationPolicy",
    "policies.termsAndConditions",
  ],
  "venue-provider": [
    // Basic Details
    "basicDetails.name",
    "basicDetails.managerName",
    "basicDetails.capacity",
    // "basicDetails.operatingHours.openingTime",
    // "basicDetails.operatingHours.closingTime",
    // "basicDetails.address",
    // "basicDetails.description",

    // Feature Details
    "featureDetails.catererServices",
    "featureDetails.decorServices",
    "featureDetails.venueTypes",
    "featureDetails.audioVisualEquipment",
    "featureDetails.accessibilityFeatures",
    "featureDetails.restrictionsPolicies",
    "featureDetails.specialFeatures",
    "featureDetails.facilities",

    // Additional Details
    "additionalDetails.photos",
    "additionalDetails.videos",
    "additionalDetails.awards",
    "additionalDetails.clientTestimonials",
    "additionalDetails.instagramURL",
    "additionalDetails.websiteURL",
    "additionalDetails.advanceBookingPeriod",
    "additionalDetails.priceStartingFrom",

    // Policies
    "policies.termsConditions",
    "policies.cancellationPolicy",
    "policies.insurancePolicy",
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

// Helper function to check verification criteria
const checkVerification = (service, serType) => {
  console.log(`Checking verification for ${serType} service...`);
  let allFieldsValid = true;

  let fieldsToCheck;

  switch (serType) {
    case "caterer":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Service Name" },
        { path: "basicDetails.managerName", label: "Manager Name" },
        { path: "basicDetails.capacity", label: "Guest Capacity" },
        { path: "basicDetails.description", label: "Description" },
        {
          path: "basicDetails.cuisine_specialities",
          label: "Cuisine Specialties",
        },
        {
          path: "basicDetails.regional_specialities",
          label: "Regional Specialties",
        },
        { path: "basicDetails.service_style_offered", label: "Service Style" },
        { path: "menuDetails.menu", label: "Menu" },
        { path: "menuDetails.vegOrNonVeg", label: "Veg Only" },
        { path: "menuDetails.pre_set_menus", label: "Add manually" },
        { path: "menuDetails.customizable", label: "Customizable Menu" },
        { path: "eventDetails.event_types_catered", label: "Event Type" },
        {
          path: "eventDetails.additional_services",
          label: "Additional Service",
        },
        {
          path: "staffAndEquipmentDetails.staff_provided",
          label: "Staff Provided",
        },
        {
          path: "additionalDetails.minimum_order_requirements",
          label: "Minimum Order Requirement",
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
          label: "Business License",
        },
        {
          path: "additionalDetails.food_safety_certificates",
          label: "Food Safety Certificate",
        },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        { path: "policies.cancellation_policy", label: "Cancellation Policy" },
        { path: "policies.terms_and_conditions", label: "Terms & Condition" },
      ];
      break;
    case "decorator":
      fieldsToCheck = [
        { path: "basicDetails.name", label: "Service Name" },
        { path: "basicDetails.eventSize", label: "Location (City)" },
        { path: "basicDetails.description", label: "Description" },
        { path: "basicDetails.eventTypes.types", label: "Types of Events" },
        {
          path: "basicDetails.eventTypes.corporate",
          label: "Corporate Events",
        },
        { path: "basicDetails.eventTypes.cultural", label: "Cultural Events" },
        { path: "themesOffered", label: "Themes Available" },
        {
          path: "themesOffered.colorSchemeAssistance",
          label: "Assistance with Creating Color Schemes",
        },
        {
          path: "themesOffered.venueAdaptability",
          label: "Adapt Themes to Different Venue Sizes",
        },
        {
          path: "themesOffered.themeCustomization",
          label: "Customization of Themes",
        },
        { path: "themesElement.themeElements", label: "Theme Elements" },
        { path: "themesElement.themePhotos", label: "Theme Photos" },
        { path: "themesElement.themeVideos", label: "Videos" },
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
          label: "A Written Theme Proposal After Consultation",
        },
        {
          path: "additionalDetails.proposalRevisions",
          label: "Revisions to the Initial Theme Proposal",
        },
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },
      ];
      break;
    case "pav":
      fieldsToCheck = [
        // Basic Details
        { path: "basicDetails.name", label: "Service Name" },
        { path: "basicDetails.eventSize", label: "Location (City)" },
        { path: "basicDetails.description", label: "Description" },
        { path: "basicDetails.eventTypes", label: "Types of Events" },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },

        // Photography Section
        {
          path: "Photography.typesOfStyles",
          label: "Photography: Types of Styles",
        },
        {
          path: "Photography.equipmentAvailable",
          label: "Photography: Equipment Available",
        },
        {
          path: "Photography.addonsOrUpgradeAvailable",
          label: "Photography: Add-ons or Upgrades Available",
        },
        {
          path: "Photography.finalDeliveryMethods",
          label: "Photography: Final Delivery Methods",
        },

        // Videography Section
        {
          path: "Videography.typesOfStyles",
          label: "Videography: Types of Styles",
        },
        {
          path: "Videography.equipmentAvailable",
          label: "Videography: Equipment Available",
        },
        {
          path: "Videography.addonsOrUpgradeAvailable",
          label: "Videography: Add-ons or Upgrades Available",
        },
        {
          path: "Videography.finalDeliveryMethods",
          label: "Videography: Final Delivery Methods",
        },

        // Consultation Details
        {
          path: "consultationDetails.freeInitialConsultation",
          label: "Free Initial Consultation",
        },
        {
          path: "consultationDetails.bookingDeposit",
          label: "Booking Deposit for Your Service",
        },
        {
          path: "consultationDetails.proposalsToClients",
          label: "Design Proposal",
        },
        {
          path: "consultationDetails.postProductionServices",
          label: "Post-production Services",
        },
        {
          path: "consultationDetails.availableForDestinationEvents",
          label: "Available for Destination Events (Out of Town)",
        },
        {
          path: "consultationDetails.AdvanceSetup",
          label: "Advance Booking Period",
        },

        // Policies
        { path: "policies.termsAndConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },

        // Additional Details
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "additionalDetails.videos", label: "Videos" },
      ];
    case "venue-provider":
      fieldsToCheck = [
        // Basic Details
        { path: "basicDetails.name", label: "Service Name" },
        // { path: "basicDetails.address", label: "Location (City)" },
        { path: "basicDetails.capacity", label: "Guest Capacity" },
        {
          path: "additionalDetails.priceStartingFrom",
          label: "Price Starting From",
        },
        // { path: "basicDetails.description", label: "Description" },

        // Feature Details
        { path: "featureDetails.venueTypes", label: "Types of Venues" },
        {
          path: "featureDetails.accessibilityFeatures",
          label: "Accessibility Features",
        },
        {
          path: "featureDetails.restrictionsPolicies",
          label: "Restrictions at Venue",
        },
        { path: "featureDetails.facilities", label: "Facilities at Venue" },

        // Services
        {
          path: "featureDetails.catererServices",
          label: "In-House Catering Service",
        },
        {
          path: "featureDetails.decorServices",
          label: "In-House Decoration Service",
        },

        // Additional Details
        {
          path: "additionalDetails.advanceBookingPeriod",
          label: "Advance Booking Period",
        },
        // { path: "basicDetails.address", label: "Venue Address" },

        // Policies
        { path: "policies.termsConditions", label: "Terms & Conditions" },
        { path: "policies.cancellationPolicy", label: "Cancellation Policy" },

        // Media
        { path: "additionalDetails.photos", label: "Photos" },
        { path: "additionalDetails.videos", label: "Videos" },
      ];

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
          // console.log(`Field "${label}" (${path}) OK`);
        } else {
          // console.log(`Field "${label}" (${path}) XXXXXXX`);
          allFieldsValid = false;
        }
      });

      return allFieldsValid;

    // Add criteria for other service types as needed
    default:
      console.log(`Unknown service type: ${serType}`);
      return false;
  }
};

export default router;
