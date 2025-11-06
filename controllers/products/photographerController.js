// import { Photographer } from "../../models/photographers.js";
import Photographer from "../../models/photographers.js";
import PAVModel from "../../models/reduxStores/pav.js";
import { Vendor as User } from "../../models/users.js";
import parseRange from "../../utils/parseRange.js";

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
      photographer.basicDetails || {}
    );
    photographer.consultationDetails.completed = checkCompletion(
      photographer.consultationDetails || {}
    );
    photographer.additionalDetails.completed = checkCompletion(
      photographer.additionalDetails || {}
    );
    photographer.policies.completed = checkCompletion(
      photographer.policies || {}
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
    // processedVideos will hold normalized plain string URLs for videos
    let processedVideos = [];
    const cancellationPolicyFileUrl = req.body.cancellationPolicy || [];
    const termsAndConditionsFileUrl = req.body.termsAndConditions || [];

    let processedPhotos = photosUrl;
    if (Array.isArray(photosUrl)) {
      processedPhotos = photosUrl.map((item) => {
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item);
            if (parsed.original || parsed.preview) {
              return parsed;
            }
            return item;
          } catch (e) {
            return item;
          }
        }
        return item;
      });
    } else if (typeof photosUrl === "string") {
      try {
        const parsed = JSON.parse(photosUrl);
        processedPhotos = [parsed];
      } catch (e) {
        processedPhotos = [photosUrl];
      }
    }

    // Normalize videos into processedVideos (array of plain strings)
    if (Array.isArray(videosUrl)) {
      processedVideos = videosUrl
        .map((item) => {
          if (typeof item === "string") {
            // try parse JSON-stringified object
            try {
              const parsed = JSON.parse(item);
              if (parsed && typeof parsed === "object" && parsed.original)
                return parsed.original;
              if (typeof parsed === "string") return parsed;
              return item;
            } catch (e) {
              return item;
            }
          }
          if (item && typeof item === "object" && item.original)
            return item.original;
          return "";
        })
        .filter(Boolean);
    } else if (typeof videosUrl === "string") {
      try {
        const arr = JSON.parse(videosUrl);
        if (Array.isArray(arr)) {
          processedVideos = arr
            .map((item) =>
              item && item.original
                ? item.original
                : typeof item === "string"
                  ? item
                  : ""
            )
            .filter(Boolean);
        } else if (arr && arr.original) {
          processedVideos = [arr.original];
        } else if (typeof arr === "string") {
          processedVideos = [arr];
        } else {
          processedVideos = [videosUrl];
        }
      } catch (e) {
        processedVideos = videosUrl ? [videosUrl] : [];
      }
    }

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
      photosUrl: processedPhotos,
      videosUrl: processedVideos,
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
      processedPhotos.length > 0, // Ensure there are photos
      processedVideos.length > 0, // Ensure there are videos
      cancellationPolicyFileUrl, // Ensure cancellationPolicy is uploaded
      termsAndConditionsFileUrl, // Ensure termsAndConditions file is uploaded
    ];

    const completedFields = fieldsToCheck.filter((field) => !!field).length;
    const profileCompletion =
      Math.round(completedFields / fieldsToCheck.length) * 100 || 0;

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
      photos: Array.isArray(processedPhotos)
        ? processedPhotos.map((url) => {
            // If it's already an object with original and preview, use it directly
            if (typeof url === "object" && url.original && url.preview) {
              return {
                original: url.original,
                preview: url.preview,
              };
            }
            // If it's just an object with original, generate preview
            if (typeof url === "object" && url.original) {
              let previewUrl = url.original;
              if (url.original.includes("/original-")) {
                previewUrl = url.original.replace("/original-", "/preview-");
                // For images, change extension to .webp
                if (url.original.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  previewUrl = previewUrl.replace(
                    /\.(jpg|jpeg|png|gif)$/i,
                    ".webp"
                  );
                }
              }
              return {
                original: url.original,
                preview: previewUrl,
              };
            }
            // If it's a string, generate both original and preview
            if (typeof url === "string") {
              let previewUrl = url;
              if (url.includes("/original-")) {
                previewUrl = url.replace("/original-", "/preview-");
                // For images, change extension to .webp
                if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  previewUrl = previewUrl.replace(
                    /\.(jpg|jpeg|png|gif)$/i,
                    ".webp"
                  );
                }
              }
              return { original: url, preview: previewUrl };
            }
            return { original: url, preview: url };
          })
        : [],
      // videos: store plain string URLs only (schema expects [String])
      videos: Array.isArray(processedVideos)
        ? processedVideos
            .map((v) =>
              typeof v === "string" ? v : v && v.original ? v.original : ""
            )
            .filter(Boolean)
        : [],
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

    // Prepare basicDetails
    const basicDetails = {
      name: req.body.name,
      description: req.body.description,
      eventSize: parseRange(req.body.eventSize), // Updated to object
      eventTypes: req.body.eventTypes,
      serviceAreas: req.body.serviceAreas || [], // Added serviceAreas
      profileCompletion, // Updated profile completion
      location: {
        lat: req.body.latitude, // Latitude
        lng: req.body.longitude, // Longitude
        googleMapsAddress: req.body.address, // Google Maps address
        pincode: req.body.pincode, // Pincode
      }, // Added location field
    };

    // Fetch agreement data from temporary PAV collection
    const tempPAVData = await PAVModel.findOne({ id: req.body.venId });
    const agreementUrl = tempPAVData?.agreementUrl || null;
    const agreementSignedAt = tempPAVData?.agreementSignedAt || null;

    if (agreementUrl) {
      console.log("Found agreement data for photographer:", agreementUrl);
    }

    // Add agreement data to policies
    const updatedPolicies = {
      ...policies,
      agreementUrl: agreementUrl,
      agreementSignedAt: agreementSignedAt,
    };

    // Create new Photographer document
    const newPhotographer = new Photographer({
      basicDetails,
      Videography, // Updated with enum for finalDeliveryMethods
      Photography, // Updated with enum for finalDeliveryMethods
      consultationDetails, // Updated with enum for duration and PackageTypes
      additionalDetails, // Updated with priceStartingFrom as number
      policies: updatedPolicies, // Updated policies with agreement data
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
    res.status(201).json({
      message: "Photographer created successfully",
      profileCompletion,
      serviceId: saved._id,
      photographer: saved, // ✅ full created object
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

const getPhotographerById = async (req, res) => {
  try {
    const photographer = await Photographer.findOne({ id: req.params.id });
    if (!photographer) {
      return res.status(404).json({ message: "Photographer not found" });
    }
    res.status(200).json(photographer);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createPhotographer, getAllPav, getPhotographerById };
