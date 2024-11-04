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

    const themePhotosUrls = getFileUrls(req.files, "themephotos")[0] || req.body.themephotos;
    const themeVideosUrls = getFileUrls(req.files, "themevideos")[0] || req.body.themevideos;
    const photosUrls = getFileUrls(req.files, "photos")[0] || req.body.photos;
    const videosUrls = getFileUrls(req.files, "videos")[0] || req.body.videos;
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

    const eventTypes = {
      types: req.body.typesOfEvents || [],
      wedding: req.body.weddingEvents || [],
      corporate: req.body.corporateEvents || [],
      seasonal: req.body.seasonalEvents || [],
      cultural: req.body.culturalEvents || [],
    };
    const newDecorator = new Decorator({
      name: req.body.name,
      id: req.body.id,
      eventSize: req.body.eventSize,
      venId: req.body.venId,
      eventTypes,
      propSelection: req.body.propthemesOffered,
      themesOffered: req.body.themesOffered,
      colorSchemeAssistance: req.body.colorschmes,
      themeCustomization: req.body.customizationsThemes,
      venueAdaptability: req.body.adobtThemes,
      customDesignProcess: req.body.customDesignProcess,
      themeElements: req.body.themeElements,
      themePhotos: themePhotosUrls,
      themeVideos: themeVideosUrls,
      themeProposels: req.body.themeProposels,
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

export default { createDecorator };