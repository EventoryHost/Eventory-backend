import Photographer from "../../models/photographers.js";
import { Vendor as User } from "../../models/users.js";

const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const calculateProfileCompletion = (photographer) => {
  const totalFields = 20; // Update with the total number of fields to evaluate
  let completedFields = 0;

  // Increment completedFields for each field that has a value
  if (photographer.basicDetails?.name) completedFields++;
  if (photographer.basicDetails?.description) completedFields++;
  if (photographer.basicDetails?.eventSize) completedFields++;
  if (photographer.basicDetails?.eventTypes?.length) completedFields++;
  if (photographer.Videography) completedFields++;
  if (photographer.Photography) completedFields++;
  if (photographer.consultationDetails?.duration) completedFields++;
  if (photographer.consultationDetails?.PackageTypes?.length) completedFields++;
  if (photographer.consultationDetails?.proposalsToClients !== undefined)
    completedFields++;
  if (photographer.consultationDetails?.freeInitialConsultation !== undefined)
    completedFields++;
  if (photographer.consultationDetails?.bookingDeposit !== undefined)
    completedFields++;
  if (
    photographer.consultationDetails?.availableForDestinationEvents !==
    undefined
  )
    completedFields++;
  if (photographer.consultationDetails?.AdvanceSetup !== undefined)
    completedFields++;
  if (photographer.consultationDetails?.postProductionServices !== undefined)
    completedFields++;
  if (photographer.additionalDetails?.photos?.length) completedFields++;
  if (photographer.additionalDetails?.videos?.length) completedFields++;
  if (photographer.additionalDetails?.clientTestimonials) completedFields++;
  if (photographer.additionalDetails?.website) completedFields++;
  if (photographer.policies?.cancellationPolicy) completedFields++;
  if (photographer.policies?.termsAndConditions) completedFields++;

  return Math.round((completedFields / totalFields) * 100); // Return percentage
};

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
const updateSectionCompletion = async (venId) => {
  try {
    const photographer = await Photographer.findOne({ venId });

    if (!photographer) {
      throw new Error("Photographer not found");
    }

    // Update completion status for each section
    photographer.basicDetails.completed = checkCompletion(photographer.basicDetails || {});
    photographer.consultationDetails.completed = checkCompletion(photographer.consultationDetails || {});
    photographer.additionalDetails.completed = checkCompletion(photographer.additionalDetails || {});
    photographer.policies.completed = checkCompletion(photographer.policies || {});

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

    const photosUrls = getFileUrls(req.files, "photos");
    const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "termsAndConditions")[0] ||
      req.body.termsAndConditions;

    const newPhotographer = new Photographer({
      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: req.body.eventSize,
        eventTypes: req.body.eventTypes,
        profileCompletion: 0, // Placeholder, will be updated later
      },
      Videography: req.body.Videography,
      Photography: req.body.Photography,
      consultationDetails: {
        duration: req.body.duration,
        PackageTypes: req.body.PackageTypes,
        proposalsToClients: req.body.proposalsToClients === "true",
        freeInitialConsultation: req.body.freeInitialConsultation === "true",
        bookingDeposit: req.body.bookingDeposit === "true",
        availableForDestinationEvents:
          req.body.availablefordestinationevents === "true",
        AdvanceSetup: req.body.Advancesetup === "true",
        postProductionServices: req.body.postproductionservices === "true",
      },
      additionalDetails: {
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
        clientTestimonials: req.body.clientTestimonials,
        awards: req.body.awards,
        website: req.body.website,
        instagram: req.body.instagram,
        priceStartingFrom: req.body.priceStartingFrom,
      },
      ...req.body,
      policies: {
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
      },
    });

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(newPhotographer);
    newPhotographer.basicDetails.profileCompletion = profileCompletion; // Add profile completion under basicDetails

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
    await updateSectionCompletion(req.body.venId);

    res.status(201).json({
      message: "Photographer created successfully",
      profileCompletion,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllPav = async (req, res) => {
  try {
    const pav = await Photographer.find();
    res.status(200).json(pav);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createPhotographer, getAllPav };
