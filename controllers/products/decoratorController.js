import { set } from "mongoose";
import { Decorator } from "../../models/decoraters.js";
import { Vendor as User } from "../../models/users.js";

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
  if (!section) return false;

  const requiredFields = Object.keys(section).filter(
    (key) => section[key] !== undefined && section[key] !== null && section[key] !== ""
  );

  return requiredFields.length === Object.keys(section).length;
};

const updateSectionCompletion = async (id) => {
  try {
    const decorator = await Decorator.findOne({ id });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    decorator.basicDetails.completed = checkCompletion(decorator.basicDetails || {});
    decorator.themesOffered.completed = checkCompletion(decorator.themesOffered || {});
    decorator.themesElement.completed = checkCompletion(decorator.themesElement || {});
    decorator.additionalDetails.completed = checkCompletion(decorator.additionalDetails || {});
    decorator.policies.completed = checkCompletion(decorator.policies || {});

    await decorator.save();
  } catch (error) {
    console.error("Error in update section completion:", error);
    throw error;
  }
};

const createDecorator = async (req, res) => {
  try {
    const alreadyExists = await Decorator.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Decorator already exists" });
    }

    const insuranceFileUrl =
      getFileUrls(req.files, "insurance")[0] || req.body.insurance;
    const privacyPolicyFileUrl =
      getFileUrls(req.files, "privacyPolicy")[0] || req.body.privacyPolicy;

    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "termsAndConditions")[0] ||
      req.body.termsAndConditions;

    const themePhotosUrls = getFileUrls(req.files, "themephotos");
    const themePhotosUrl = themePhotosUrls.length
      ? themePhotosUrls
      : req.body.themephotos || [];

    const themeVideosUrls = getFileUrls(req.files, "themevideos");
    const themeVideosUrl = themeVideosUrls.length
      ? themeVideosUrls
      : req.body.themevideos || [];

    const photosUrls = getFileUrls(req.files, "photos");
    const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

    const eventTypes = {
      types: req.body.typesOfEvents || [],
      wedding: req.body.weddingEvents || [],
      corporate: req.body.corporateEvents || [],
      seasonal: req.body.seasonalEvents || [],
      cultural: req.body.culturalEvents || [],
    };

    // Calculate profile completion
    const fieldsToCheck = [
      req.body.name,
      req.body.description,
      req.body.eventSize,
      req.body.duration,
      req.body.themesOffered?.length > 0, // Check if at least one theme is offered
      req.body.customDesignProcess,
      req.body.themeElements?.length > 0, // Check if at least one theme element exists
      req.body.clientTestimonials,
      req.body.websiteurl,
      req.body.intstagramurl,
      req.body.advanceBookingPeriod,
      req.body.priceStartingFrom,
      req.body.themeProposels,
      req.body.proposalRevisions,
      cancellationPolicyFileUrl,
      termsAndConditionsFileUrl,
      themePhotosUrls.length > 0, // At least one photo
      themeVideosUrls.length > 0, // At least one video
      photosUrls.length > 0, // At least one additional photo
      videosUrls.length > 0, // At least one additional video
    ];
    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    const newDecorator = new Decorator({
      basicDetails: {
        name: req.body.name,
        description: req.body.description,
        eventSize: req.body.eventSize,
        eventTypes,
        duration: req.body.duration,
        profileCompletion,
      },
      themesOffered: {
        themesOffered: req.body.themesOffered,
        customDesignProcess: req.body.customDesignProcess,
        propSelection: req.body.propthemesOffered,
        colorSchemeAssistance: req.body.colorschmes,
        themeCustomization: req.body.customizationsThemes,
        venueAdaptability: req.body.adobtThemes,
      },
      themesElement: {
        themeElements: req.body.themeElements,
        themePhotos: Array.isArray(themePhotosUrl)
          ? themePhotosUrl
          : [themePhotosUrl],
        themeVideos: Array.isArray(themeVideosUrl)
          ? themeVideosUrl
          : [themeVideosUrl],
      },
      additionalDetails: {
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
        clientTestimonials: req.body.clientTestimonials,
        awards: req.body.awards,
        website: req.body.websiteurl,
        instagram: req.body.intstagramurl,
        advanceBookingPeriod: req.body.advanceBookingPeriod,
        priceStartingFrom: req.body.priceStartingFrom,
        themeProposels: req.body.themeProposels,
        proposalRevisions: req.body.proposalRevisions,
      },
      policies: {
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
      },
      id: req.body.id,
      venId: req.body.venId,
    });

    const savedDecorator = await newDecorator.save();

    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await Decorator.findByIdAndDelete(savedDecorator.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "decorator",
      serId: savedDecorator.id,
    });
    await vendor.save();
    // Update section completion and profile completion
    await updateSectionCompletion(savedDecorator.id);
    res.status(201).json(savedDecorator);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllDecorators = async (req, res) => {
  try {
    const decorators = await Decorator.find();
    res.status(200).json(decorators);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createDecorator, getAllDecorators };
