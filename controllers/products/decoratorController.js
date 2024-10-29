import { set } from "mongoose";
import { Decorator } from "../../models/decoraters.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
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

    const themePhotosUrls = getFileUrls(req.files, "themePhotos");
    const themeVideosUrls = getFileUrls(req.files, "themeVideos");
    const photosUrls = getFileUrls(req.files, "photos");
    const videosUrls = getFileUrls(req.files, "videos");
    const insuranceFileUrl =
      getFileUrls(req.files, "insurance")[0] || req.body.insurance;
    const privacyPolicyFileUrl =
      getFileUrls(req.files, "privacyPolicy")[0] || req.body.privacyPolicy;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;

    const newDecorator = new Decorator({
      name: req.body.name,
      id: req.body.id,
      eventSize: req.body.eventSize,
      venId: req.body.venId,
      eventTypes: req.body.eventTypes,
      themesOffered: req.body.themesOffered,
      propSelection: req.body.propSelection,
      colorSchemeAssistance: req.body.colorSchemeAssistance,
      themeCustomization: req.body.themeCustomization,
      venueAdaptability: req.body.venueAdaptability,
      customDesignProcess: req.body.customDesignProcess,
      themeElements: req.body.themeElements,
      themePhotos: themePhotosUrls,
      themeVideos: themeVideosUrls,
      setupAndInstallation: req.body.setupAndInstallation,
      advanceBookingPeriod: req.body.advanceBookingPeriod,
      proposalRevisions: req.body.proposalRevisions,
      consultationProcess: req.body.consultationProcess,
      clientTestimonials: req.body.clientTestimonials,
      awards: req.body.awards,
      insurancePolicy: insuranceFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
      termsAndConditions: termsAndConditionsFileUrl,
      privacyPolicy: privacyPolicyFileUrl,
      photos: photosUrls,
      videos: videosUrls,
      website: req.body.website,
      instagram: req.body.instagram,
    });

    const savedDecorator = await newDecorator.save();
    res.status(201).json(savedDecorator);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createDecorator };
