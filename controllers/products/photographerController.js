// import { Photographer } from "../../models/photographers.js";
import Photographer from "../../models/photographers.js";
import { Vendor as User } from "../../models/users.js";
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

// const calculateProfileCompletion = (photographer) => {
//   const totalFields = 20; // Update with the total number of fields to evaluate
//   let completedFields = 0;

//   // Increment completedFields for each field that has a value
//   if (photographer.basicDetails?.name) completedFields++;
//   if (photographer.basicDetails?.description) completedFields++;
//   if (photographer.basicDetails?.eventSize) completedFields++;
//   if (photographer.basicDetails?.eventTypes?.length) completedFields++;
//   if (photographer.Videography) completedFields++;
//   if (photographer.Photography) completedFields++;
//   if (photographer.consultationDetails?.duration) completedFields++;
//   if (photographer.consultationDetails?.PackageTypes?.length) completedFields++;
//   if (photographer.consultationDetails?.proposalsToClients !== undefined)
//     completedFields++;
//   if (photographer.consultationDetails?.freeInitialConsultation !== undefined)
//     completedFields++;
//   if (photographer.consultationDetails?.bookingDeposit !== undefined)
//     completedFields++;
//   if (
//     photographer.consultationDetails?.availableForDestinationEvents !==
//     undefined
//   )
//     completedFields++;
//   if (photographer.consultationDetails?.AdvanceSetup !== undefined)
//     completedFields++;
//   if (photographer.consultationDetails?.postProductionServices !== undefined)
//     completedFields++;
//   if (photographer.additionalDetails?.photos?.length) completedFields++;
//   if (photographer.additionalDetails?.videos?.length) completedFields++;
//   if (photographer.additionalDetails?.clientTestimonials) completedFields++;
//   if (photographer.additionalDetails?.website) completedFields++;
//   if (photographer.policies?.cancellationPolicy) completedFields++;
//   if (photographer.policies?.termsAndConditions) completedFields++;

//   return Math.round((completedFields / totalFields) * 100); // Return percentage
// };

// Helper function to check if a section is complete
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

// Update section completion for a photographer
const updateSectionCompletion = async (id) => {
  try {
    const photographer = await Photographer.findOne({ id });

    if (!photographer) {
      throw new Error("Photographer not found");
    }

    // Update completion status for each section
    photographer.basicDetails.completed = checkCompletion(
      photographer.basicDetails || {},
    );
    photographer.consultationDetails.completed = checkCompletion(
      photographer.consultationDetails || {},
    );
    photographer.additionalDetails.completed = checkCompletion(
      photographer.additionalDetails || {},
    );
    photographer.policies.completed = checkCompletion(
      photographer.policies || {},
    );

    await photographer.save();
  } catch (error) {
    console.error("Error in updateSectionCompletion:", error);
    throw error;
  }
};

const createPhotographer = async (req, res) => {
  try {
    const alreadyExists = await Photographer.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Photographer already exists" });
    }

    console.log(req.body);

    const photosUrl = req.body.photos || [];
    const videosUrl = req.body.videos || [];
    const cancellationPolicyFileUrl = req.body.cancellationPolicy || [];
    const termsAndConditionsFileUrl = req.body.termsAndConditions || [];

    // Log fields to debug
    console.log("Incoming fields:", {
      name: req.body.name,
      description: req.body.description,
      eventSize: req.body.eventSize,
      eventTypes: req.body.eventTypes,
      Videography: req.body.Videography,
      Photography: req.body.Photography,
      duration: req.body.duration,
      PackageTypes: req.body.PackageTypes,
      proposalsToClients: req.body.proposalsToClients,
      freeInitialConsultation: req.body.freeInitialConsultation,
      bookingDeposit: req.body.bookingDeposit,
      availablefordestinationevents: req.body.availablefordestinationevents,
      Advancesetup: req.body.Advancesetup,
      postproductionservices: req.body.postproductionservices,
      photosUrl,
      videosUrl,
      cancellationPolicyFileUrl,
      termsAndConditionsFileUrl,
    });

    const fieldsToCheck = [
      req.body.name,
      req.body.latitude,
      req.body.longitude,
      req.body.address,
      req.body.description,
      req.body.eventSize,
      req.body.eventTypes?.length > 0, // Ensure eventTypes is not empty
      req.body.Videography,
      req.body.Photography,
      req.body.duration,
      req.body.PackageTypes?.length > 0, // Ensure PackageTypes is not empty
      req.body.proposalsToClients, // Ensure proposalsToClients is defined
      req.body.freeInitialConsultation, // Ensure freeInitialConsultation is defined
      req.body.bookingDeposit, // Ensure bookingDeposit is defined
      req.body.availablefordestinationevents, // Ensure availableForDestinationEvents is defined
      req.body.Advancesetup, // Ensure AdvanceSetup is defined
      req.body.postproductionservices, // Ensure postProductionServices is defined
      photosUrl.length > 0, // Ensure there are photos
      videosUrl.length > 0, // Ensure there are videos
      cancellationPolicyFileUrl, // Ensure cancellationPolicy is uploaded
      termsAndConditionsFileUrl, // Ensure termsAndConditions file is uploaded
    ];

    const completedFields = fieldsToCheck.filter((field) => !!field).length;
    const profileCompletion =
      Math.round(completedFields / fieldsToCheck.length) * 100 || 0;

    // Debug profile completion calculation
    console.log("Fields to Check:", fieldsToCheck);
    console.log("Completed Fields:", completedFields);
    console.log("Profile Completion:", profileCompletion);

    // Prepare eventSize object
    // const eventSizeCheck = parseRange(req.body.eventSize);
    // console.log("Parsed Event Size:", eventSizeCheck);

    // Prepare Videography and Photography finalDeliveryMethods
    const Videography = {
      ...req.body.Videography,
      finalDeliveryMethods: req.body.Videography.finalDeliveryMethods, // Ensure enum value is passed
    };

    const Photography = {
      ...req.body.Photography,
      finalDeliveryMethods: req.body.Photography.finalDeliveryMethods, // Ensure enum value is passed
    };

    // Prepare consultationDetails
    const consultationDetails = {
      duration: req.body.duration, // Ensure enum value is passed
      PackageTypes: req.body.PackageTypes, // Ensure enum value is passed
      proposalsToClients: req.body.proposalsToClients === "true",
      freeInitialConsultation: req.body.freeInitialConsultation === "true",
      bookingDeposit: req.body.bookingDeposit === "true",
      availableForDestinationEvents:
        req.body.availablefordestinationevents === "true",
      AdvanceSetup: req.body.Advancesetup === "true",
      postProductionServices: req.body.postproductionservices === "true",
    };

    // Prepare additionalDetails
    const additionalDetails = {
      photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
      videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
      clientTestimonials: req.body.clientTestimonials,
      awards: req.body.awards,
      website: req.body.website,
      instagram: req.body.instagram,
      priceStartingFrom: parseFloat(req.body.priceStartingFrom), // Convert to number
    };

    // Prepare policies
    const policies = {
      cancellationPolicy: cancellationPolicyFileUrl,
      termsAndConditions: termsAndConditionsFileUrl,
    };

    const basicDetails = {
      name: req.body.name,
      description: req.body.description,
      eventSize: parseRange(req.body.eventSize), // Updated to object
      eventTypes: req.body.eventTypes,
      profileCompletion, // Updated profile completion
      location: {
        lat: req.body.latitude, // Latitude
        lng: req.body.longitude, // Longitude
        googleMapsAddress: req.body.address, // Google Maps address
        pincode: req.body.pincode, // Pincode
      }, // Added location field
    };

    // Create new Photographer document
    const newPhotographer = new Photographer({
      basicDetails,
      Videography, // Updated with enum for finalDeliveryMethods
      Photography, // Updated with enum for finalDeliveryMethods
      consultationDetails, // Updated with enum for duration and PackageTypes
      additionalDetails, // Updated with priceStartingFrom as number
      policies, // Policies remain the same
      venId: req.body.venId,
      vendorType: "photographer",
      rating: 0, // Added rating field
    });

    // console.log(eventSizeCheck.ll);
    // console.log(eventSizeCheck.ul);

    const saved = await newPhotographer.save();
    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await Photographer.findByIdAndDelete(saved.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "pav",
      serId: saved.id,
    });
    await vendor.save();

    // Call to update section completion
    await updateSectionCompletion(newPhotographer.id);
    !process.env.IS_DEV && sendEmailToSlack({
          name: saved.basicDetails.name,
          type: saved.type,
        })
    res.status(201).json({
      message: "Photographer created successfully",
      profileCompletion,
    });
  } catch (error) {
    console.error("Error creating photographer:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllPav = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const pav = await Photographer.find().skip(skip).limit(itemsPerPage);

    const totalpav = await Photographer.countDocuments();

    res.status(200).json({
      data: pav,
      currentPage: page,
      totalPages: Math.ceil(totalpav / itemsPerPage),
      totalItems: totalpav,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createPhotographer, getAllPav };
