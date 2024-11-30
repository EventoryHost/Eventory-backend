import Photographer from "../../models/photographers.js";

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

const createPhotographer = async (req, res) => {
  try {
    // Check if the photographer already exists based on name and vendor ID
    const alreadyExists = await Photographer.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Photographer already exists" });
    }

    // Process file uploads if available

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

    // Create a new photographer with provided data
    const newPhotographer = new Photographer({
      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: req.body.eventSize,
        eventTypes: req.body.eventTypes,
      },
      Videography: req.body.Videography,
      Photography: req.bo.Photography,
      consultationDetails: {
        duration: req.body.duration,
        PackageTypes: req.body.PackageTypes,
        designProposals: req.body.designProposals,
        freeInitialConsultation: req.body.freeInitialConsultation,
        bookingDepositRequired: req.body.bookingDepositRequired,
        availableForOutofTownbooking: req.body.availableForOutofTownbooking,
        Advancesetup: req.body.Advancesetup,
        postproductionservices: req.body.postproductionservices,
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

    // Save the photographer to the database
    await newPhotographer.save();
    // console.log(newPhotographer);
    res.status(201).json({ message: "Photographer created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch all photographers
const getAllPav = async (req, res) => {
  try {
    const pav = await Photographer.find();
    res.status(200).json(pav);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createPhotographer, getAllPav };
