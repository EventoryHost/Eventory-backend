import { set } from "mongoose";
import { Decorator } from "../../models/decoraters.js";
import { Vendor as User } from "../../models/users.js";
import parseRange from "../../utils/parseRange.js";
import { sendEmailToSlack } from "../sesController.js";

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

const updateSectionCompletion = async (id) => {
  try {
    const decorator = await Decorator.findOne({ id });

    if (!decorator) {
      throw new Error("Decorator not found");
    }

    decorator.basicDetails.completed = checkCompletion(
      decorator.basicDetails || {},
    );
    decorator.themesOffered.completed = checkCompletion(
      decorator.themesOffered || {},
    );
    decorator.themesElement.completed = checkCompletion(
      decorator.themesElement || {},
    );
    decorator.additionalDetails.completed = checkCompletion(
      decorator.additionalDetails || {},
    );
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

    const insuranceFileUrl = req.body.insurance || [];
    const privacyPolicyFileUrl = req.body.privacyPolicy || [];

    const cancellationPolicyFileUrl = req.body.cancellationPolicy || "";
    const termsAndConditionsFileUrl = req.body.termsAndConditions || "";

    const themePhotosUrl = req.body.themephotos || [];
    const themeVideosUrl = req.body.themevideos || [];

    const photosUrl = req.body.photos || [];
    const videosUrl = req.body.videos || [];    
    const eventTypes = {
      types: req.body.typesOfEvents || [],
      wedding: req.body.weddingEvents || [],
      corporate: req.body.corporateEvents || [],
      seasonal: req.body.seasonalEvents || [],
      cultural: req.body.culturalEvents || [],
    };
    
    console.log("Service Areas received:", req.body.serviceAreas);

    // Calculate profile completion
    const fieldsToCheck = [
      req.body.name,
      req.body.description,
      req.body.address,
      req.body.latitude,
      req.body.longitude,
      req.body.eventSize, // Check if eventSize.ul exists
      req.body.duration,
      req.body.corporateEvents?.length > 0, // Check if at least one event type exists
      req.body.culturalEvents?.length > 0, // Check if at least one event type exists
      req.body.themesOffered?.length > 0, // Check if at least one theme is offered
      req.body.themeElements?.length > 0, // Check if at least one theme element exists
      req.body.colorSchemeAssistance,
      req.body.venueAdaptability,
      req.body.propSelection,
      req.body.customizationsThemes,
      req.body.clientTestimonials,
      req.body.websiteurl,
      req.body.intstagramurl,
      req.body.advanceBookingPeriod,
      req.body.priceStartingFrom,
      req.body.themeProposels,
      req.body.proposalRevisions,
      cancellationPolicyFileUrl,
      termsAndConditionsFileUrl,
      themePhotosUrl.length > 0, // At least one photo
      photosUrl.length > 0, // At least one additional photo
      videosUrl.length > 0, // At least one additional video
    ];
    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;
    const eventSize = parseRange(req.body.eventSize);
    console.log("decorator:", req.body);
    const newDecorator = new Decorator({      basicDetails: {        name: req.body.name,
        description: req.body.description,
        eventSize,
        serviceAreas: req.body.serviceAreas || [],
        eventTypes: {
          types: req.body.typesOfEvents || [],
          wedding: req.body.weddingEvents || [],
          corporate: req.body.corporateEvents || [],
          seasonal: req.body.seasonalEvents || [],
          cultural: req.body.culturalEvents || [],
        },
        duration: req.body.duration,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        profileCompletion,
        location: {
          lat: req.body.latitude, // Latitude
          lng: req.body.longitude, // Longitude
          googleMapsAddress: req.body.address, // Google Maps address
          pincode: req.body.pincode, // Pincode
        },
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
        advanceBookingPeriod: parseRange(req.body.advanceBookingPeriod),
        priceStartingFrom: Number(req.body.priceStartingFrom), // Convert to number
        themeProposels: req.body.themeProposels,
        proposalRevisions: req.body.proposalRevisions,
      },
      policies: {
        cancellationPolicy: cancellationPolicyFileUrl,
        termsAndConditions: termsAndConditionsFileUrl,
      },
      id: req.body.id,
      venId: req.body.venId,
      rating: 0, // Default rating
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
    process.env.IS_DEV !== "true" && sendEmailToSlack({

          name: savedDecorator.basicDetails.name,
          type: savedDecorator.type,
        })
    res.status(201).json(savedDecorator);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllDecorators = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const decorators = await Decorator.find().skip(skip).limit(itemsPerPage);

    const totaldecorators = await Decorator.countDocuments();

    res.status(200).json({
      data: decorators,
      currentPage: page,
      totalPages: Math.ceil(totaldecorators / itemsPerPage),
      totalItems: totaldecorators,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createDecorator, getAllDecorators };
