import { set } from "mongoose";
import { Decorator } from "../../models/decoraters.js";

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
    const newDecorator = new Decorator({
      basicDetails:{
        name: req.body.name,
        description: req.body.description,
        eventSize: req.body.eventSize,
        eventTypes,
        duration:req.body.duration,
      },
      themesOffered:{
        themesOffered: req.body.themesOffered,
        customDesignProcess: req.body.customDesignProcess,
        propSelection: req.body.propthemesOffered,
        colorSchemeAssistance: req.body.colorschmes,
        themeCustomization: req.body.customizationsThemes,
        venueAdaptability: req.body.adobtThemes,
      },
      themesElement:{
        themeElements: req.body.themeElements,
        themePhotos: Array.isArray(themePhotosUrl)
          ? themePhotosUrl
          : [themePhotosUrl],
        themeVideos: Array.isArray(themeVideosUrl)
          ? themeVideosUrl
          : [themeVideosUrl],
      },
      additionalDetails:{
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
        clientTestimonials: req.body.clientTestimonials,
        awards: req.body.awards,
        website: req.body.website,
        instagram: req.body.instagram,
        advanceBookingPeriod: req.body.advanceBookingPeriod,
        priceStartingFrom:req.body.priceStartingFrom,
        themeProposels: req.body.themeProposels,
      
        proposalRevisions: req.body.proposalRevisions,
      }
      ,
      policies:{
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
      },
      id: req.body.id,
      venId: req.body.venId,
      
    
      
      // consultationProcess: req.body.consultationProcess,
      // insurancePolicy: insuranceFileUrl,
     
      // privacyPolicy: privacyPolicyFileUrl,
     
      

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
