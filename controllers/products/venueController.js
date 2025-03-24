// import { Venue } from "../../models/venue.js";

// const getFileUrls = (files, fieldName) => {
//   const fileArray = files[fieldName];
//   if (fileArray) {
//     return Array.isArray(fileArray)
//       ? fileArray.map((file) => file.location)
//       : [fileArray.location];
//   }
//   return [];
// };

// const calculateProfileCompletion = (venue) => {
//   const totalFields = 26; // Total number of fields considered for profile completion
//   let completedFields = 0;

//   // Check and count completed fields
//   const fields = [
//     venue.basicDetails.managerName,
//     venue.basicDetails.name,
//     venue.basicDetails.capacity,
//     venue.basicDetails.address,
//     venue.basicDetails.operatingHours,
//     venue.basicDetails.description,
//     venue.featureDetails.venueTypes,
//     venue.featureDetails.decorServices,
//     venue.featureDetails.catererServices,
//     venue.featureDetails.restrictionsPolicies,
//     venue.featureDetails.speacialFeatures,
//     venue.featureDetails.audioVisualEquipment,
//     venue.featureDetails.accessibilityFeatures,
//     venue.featureDetails.facilities,
//     venue.additionalDetails.photos,
//     venue.additionalDetails.videos,
//     venue.additionalDetails.instagramURL,
//     venue.additionalDetails.websiteURL,
//     venue.additionalDetails.awards,
//     venue.additionalDetails.clientTestimonials,
//     venue.additionalDetails.advanceBookingPeriod,
//     venue.additionalDetails.priceStartingFrom,
//     venue.policies.termsConditions,
//     venue.policies.cancellationPolicy,
//     venue.policies.insurancePolicy,
//   ];

//   fields.forEach((field) => {
//     if (field && field.length) completedFields += 1;
//   });

//   return Math.round((completedFields / totalFields) * 100);
// };

// const createVenue = async (req, res) => {
//   try {
//     const alreadyExists = await Venue.findOne({
//       name: req.body.name,
//       id: req.body.venId,
//     });
//     if (alreadyExists) {
//       return res.status(400).json({ message: "Venue already exists" });
//     }

//     const termsAndConditionsFileUrl =
//       getFileUrls(req.files, "termsConditions")[0] || req.body.termsConditions;
//     const cancellationPolicyFileUrl =
//       getFileUrls(req.files, "cancellationPolicy")[0] ||
//       req.body.cancellationPolicy;

//     const photosUrls = getFileUrls(req.files, "photos");
//     const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

//     const videosUrls = getFileUrls(req.files, "videos");
//     const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

//     const insurancePolicyUrl =
//       getFileUrls(req.files, "insurancePolicy")[0] || req.body.insurancePolicy;

//     const newVenue = new Venue({
//       id: req.body.id,
//       venId: req.body.venId,

//       basicDetails: {
//         managerName: req.body.managerName,
//         name: req.body.name,
//         capacity: req.body.capacity,
//         address: req.body.address,
//         operatingHours: req.body.operatingHours,
//         description: req.body.venueDescription,
//       },
//       featureDetails: {
//         venueTypes: req.body.venueTypes,
//         decorServices: req.body.decorServices,
//         catererServices: req.body.catererServices,
//         restrictionsPolicies: req.body.restrictionsPolicies,
//         speacialFeatures: req.body.speacialFeatures,
//         audioVisualEquipment: req.body.audioVisualEquipment,
//         accessibilityFeatures: req.body.accessibilityFeatures,
//         facilities: req.body.facilities,
//       },
//       additionalDetails: {
//         photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
//         videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
//         instagramURL: req.body.instagramURL,
//         websiteURL: req.body.websiteURL,
//         awards: req.body.awards,
//         clientTestimonials: req.body.clientTestimonials,
//         advanceBookingPeriod: req.body.advanceBookingPeriod,
//         priceStartingFrom: req.body.priceStartingFrom,
//       },

//       policies: {
//         termsConditions: termsAndConditionsFileUrl,
//         cancellationPolicy: cancellationPolicyFileUrl,
//         insurancePolicy: insurancePolicyUrl,
//       },
//     });

//     // Calculate profile completion percentage
//     const profileCompletion = calculateProfileCompletion(newVenue);
//     newVenue.profileCompletion = profileCompletion;

//     const savedVenue = await newVenue.save();
//     const vendor = await User.findOne({ id: req.body.venId });
//     if (!vendor) {
//       await Venue.findByIdAndDelete(savedVenue.id);
//       return res.status(404).json({ message: "Vendor not found" });
//     }

//     vendor.serviceIds.push({
//       serType: "venue-provider",
//       serId: savedVenue.id,
//     });
//     await vendor.save();

//     res.status(201).json(savedVenue);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// const getAllVenues = async (req, res) => {
//   try {
//     const venue = await Venue.find();
//     res.status(200).json(venue);
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export default { createVenue, getAllVenues };

import { Venue } from "../../models/venue.js";
import { Vendor as User } from "../../models/users.js";
import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decoraters.js";
import Photographer from "../../models/photographers.js";
import PropRental from "../../models/props.js";

const getFileUrls = (files, fieldName) => {
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

  const requiredFields = Object.keys(section).filter((key) => {
    const value = section[key];

    // If the field is an array, check that it's not empty
    if (Array.isArray(value)) {
      return value.length > 0; // Ensure the array is not empty
    }
    // If the field is an object, check its keys too (recursive check)
    if (typeof value === "object" && value !== null) {
      return checkCompletion(value); // Recurse for nested objects
    }
    // For other types, check that it's not null, undefined, or an empty string
    return value !== undefined && value !== null && value !== "";
  });

  // Return true if all required fields are filled
  return requiredFields.length === Object.keys(section).length;
};

const updateSectionCompletion = async (venId) => {
  try {
    const venue = await Venue.findOne({
      id: venId,
    });

    if (!venue) {
      throw new Error("Venue not found");
    }

    venue.basicDetails.completed = checkCompletion(venue.basicDetails || {});
    venue.featureDetails.completed = checkCompletion(
      venue.featureDetails || {},
    );
    venue.additionalDetails.completed = checkCompletion(
      venue.additionalDetails || {},
    );
    venue.policies.completed = checkCompletion(venue.policies || {});

    await venue.save();
  } catch (error) {
    console.error("Error in update section:", error);
    throw error;
  }
};

const createVenue = async (req, res) => {
  try {
    const alreadyExists = await Venue.findOne({
      name: req.body.name,
      id: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Venue already exists" });
    }

    const termsAndConditionsFileUrl = req.body.termsConditions || [];
    const cancellationPolicyFileUrl = req.body.cancellationPolicy || [];

    const photos = req.body.photos || [];

    const videos = req.body.videos || [];

    const newVenue = new Venue({
      basicDetails: {
        managerName: req.body.managerName,
        name: req.body.name,
        capacity: req.body.capacity,
        address: req.body.address,
        operatingHours: req.body.operatingHours,
        description: req.body.description,
        latitude: req.body.latitude, // Ensure latitude is included
        longitude: req.body.longitude,
        profileCompletion: 0, // Initial placeholder
      },
      venId: req.body.venId,
      featureDetails: {
        venueTypes: req.body.venueTypes,
        decorServices: req.body.decorServices,
        catererServices: req.body.catererServices,
        restrictionsPolicies: req.body.restrictionsPolicies,
        specialFeatures: req.body.specialFeatures,
        audioVisualEquipment: req.body.audioVisualEquipment,
        accessibilityFeatures: req.body.accessibilityFeatures,
        facilities: req.body.facilities,
      },
      additionalDetails: {
        photos: Array.isArray(photos) ? photos : [photos],
        videos: Array.isArray(videos) ? videos : [videos],
        instagramURL: req.body.instagramURL,
        websiteURL: req.body.websiteURL,
        awards: req.body.awards,
        clientTestimonials: req.body.clientTestimonials,
        advanceBookingPeriod: req.body.advanceBookingPeriod,
        priceStartingFrom: req.body.priceStartingFrom,
      },
      policies: {
        termsConditions: termsAndConditionsFileUrl,
        cancellationPolicy: cancellationPolicyFileUrl,
        insurancePolicy: req.body.insurancePolicy,
      },
    });

    // Fields to check for profile completion
    const fieldsToCheck = [
      req.body.name,
      req.body.managerName,
      req.body.capacity,
      req.body.address,
      req.body.operatingHours,
      req.body.description,
      req.body.venueTypes?.length > 0,
      req.body.decorServices?.length > 0,
      req.body.catererServices?.length > 0,
      req.body.restrictionsPolicies?.length > 0,
      req.body.specialFeatures?.length > 0,
      req.body.audioVisualEquipment?.length > 0,
      req.body.accessibilityFeatures?.length > 0,
      req.body.facilities?.length > 0,
      photos.length > 0,
      videos.length > 0,
      req.body.instagramURL,
      req.body.websiteURL,
      req.body.awards?.length > 0,
      req.body.clientTestimonials,
      req.body.advanceBookingPeriod,
      req.body.priceStartingFrom,
      termsAndConditionsFileUrl,
      cancellationPolicyFileUrl,
      req.body.insurancePolicy,
    ];

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    console.log(
      "profileCompletion came out to be in venue ------",
      profileCompletion,
    );
    console.log(
      "completedFields came out to be in venue ------",
      completedFields,
    );

    newVenue.basicDetails.profileCompletion = profileCompletion;

    const savedVenue = await newVenue.save();

    // Update section completion
    await updateSectionCompletion(savedVenue.id);

    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await Venue.findByIdAndDelete(savedVenue.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "venue-provider",
      serId: savedVenue.id,
    });

    await vendor.save();

    res.status(201).json(savedVenue);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const getAllVenues = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const venues =
      page == -1
        ? await Venue.find()
        : await Venue.find().skip(skip).limit(itemsPerPage);

    const totalvenues = await Venue.countDocuments();
    console.log("data is ", venues);
    res.status(200).json({
      data: venues,
      currentPage: page,
      totalPages: Math.ceil(totalvenues / itemsPerPage),
      totalItems: totalvenues,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getVenueImages = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await Venue.findOne({ id: id }).lean();

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    return res.status(200).json(venue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVenueVideos = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await Venue.findOne({ venId: id }).lean();
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const videos = venue.videos || [];
    return res.status(200).json(videos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addReviews = async (req, res) => {
  try {
    const { date, feedback, id, name, photos, rating, type } = req.body;
    if (!id || !name || !rating || !feedback || !type || !Date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (type === "venue") {
      const venue = await Venue.findOne({ id: id });
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      if (!venue.reviews) {
        venue.reviews = [];
      }
      venue.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await venue.save();
      res.status(200).json(venue);
    } else if (type === "caterer") {
      const caterer = await Caterer.findOne({ id: id });
      if (!caterer) {
        return res.status(404).json({ message: "Caterer not found" });
      }
      if (!caterer.reviews) {
        caterer.reviews = [];
      }
      caterer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await caterer.save();
      res.status(200).json(caterer);
    } else if (type === "decorator") {
      const decorator = await Decorator.findOne({ id: id });
      if (!decorator) {
        return res.status(404).json({ message: "Decorator not found" });
      }
      if (!decorator.reviews) {
        decorator.reviews = [];
      }
      decorator.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await decorator.save();
      res.status(200).json(decorator);
    } else if (type === "photographer") {
      const photographer = await Photographer.findOne({ id: id });
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      if (!photographer.reviews) {
        photographer.reviews = [];
      }
      photographer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await photographer.save();
      res.status(200).json(photographer);
    } else if (type === "propRental") {
      const prop = await PropRental.findOne({ id: id });
      if (!prop) {
        return res.status(404).json({ message: "Prop Rental not found" });
      }
      if (!prop.reviews) {
        prop.reviews = [];
      }
      prop.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await prop.save();
      res.status(200).json(prop);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVenueReviews = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await Venue.findOne({ id: id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.status(200).json(venue.reviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default { createVenue, getAllVenues };
