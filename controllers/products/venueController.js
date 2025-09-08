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
import VenueModel from "../../models/reduxStores/venue-provider.js";
import { Vendor as User } from "../../models/users.js";
import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decoraters.js";
import Photographer from "../../models/photographers.js";
import PropRental from "../../models/props.js";
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
    // Check if the venue already exists
    console.log(req.body);
    // const alreadyExists = await Venue.findOne({
    //   "basicDetails.name": req.body.name,
    //   venId: req.body.venId,
    // });
    // if (alreadyExists) {
    //   return res.status(400).json({ message: "Venue already exists" });
    // }

    // Extract file URLs from the request
    const termsAndConditionsFileUrl = req.body.termsConditions || [];

    const cancellationPolicyFileUrl = req.body.cancellationPolicy || [];
    const insurancePolicyFileUrl = req.body.insurancePolicy || [];
    const photosUrl = req.body.photos || [];
    const videosUrl = req.body.videos || [];

    console.log("Hit3");
    // Create a new venue object
    console.log(JSON.parse(req.body.operatingHours));
    const operatingHours = JSON.parse(req.body.operatingHours);
    console.log("Hit");
    
    // Fetch agreement data from temporary venue collection
    const tempVenueData = await VenueModel.findOne({ id: req.body.venId });
    const agreementUrl = tempVenueData?.agreementUrl || null;
    const agreementSignedAt = tempVenueData?.agreementSignedAt || null;
    
    if (agreementUrl) {
      console.log("Found agreement data for venue:", agreementUrl);
    }
    
    const newVenue = new Venue({
      type: "venue",
      venId: req.body.venId,
      vendorType: "venue",
      schedule: req.body.schedule || [], // Optional: Add events if provided

      basicDetails: {
        completed: false, // Will be updated based on completion
        name: req.body.name,
        managerName: req.body.managerName,
        capacity: parseRange(req.body.capacity),
        operatingHours,
        // address: req.body.address,
        description: req.body.description,
        serviceAreas: req.body.serviceAreas || [], // Add service areas array
        location: {
          lat: req.body.latitude,
          lng: req.body.longitude,
          googleMapsAddress: req.body.address,
          pincode: req.body.pincode, // Pincode
        },
        profileCompletion: 0, // Initial placeholder
      },

      featureDetails: {
        completed: false, // Will be updated based on completion
        catererServices: req.body.catererServices,
        eventTypes: req.body.eventTypes,
        restrictionsPolicies: req.body.restrictionsPolicies,
        specialFeatures: req.body.specialFeatures,
        decorServices: req.body.decorServices,
        venueTypes: req.body.venueTypes,
        audioVisualEquipment: req.body.audioVisualEquipment,
        accessibilityFeatures: req.body.accessibilityFeatures,
        facilities: req.body.facilities,
      },

      additionalDetails: {
        completed: false, // Will be updated based on completion
        photos: Array.isArray(photosUrl) ? photosUrl.map(url => {
          // Check if URL is already an object with original and preview
          if (typeof url === 'object' && url.original && url.preview) {
            return url;
          }
          // Convert string URL to object format
          return { original: url, preview: url };
        }) : [{ original: photosUrl, preview: photosUrl }],
        videos: Array.isArray(videosUrl) ? videosUrl.map(url => {
          // Check if URL is already an object with original and preview
          if (typeof url === 'object' && url.original && url.preview) {
            return url;
          }
          // Convert string URL to object format
          return { original: url, preview: url };
        }) : [{ original: videosUrl, preview: videosUrl }],
        awards: req.body.awards,
        clientTestimonials: req.body.clientTestimonials,
        instagramURL: req.body.instagramURL,
        websiteURL: req.body.websiteURL,
        advanceBookingPeriod: parseRange(req.body.advanceBookingPeriod),
        priceStartingFrom: req.body.priceStartingFrom,
      },

      policies: {
        completed: false, // Will be updated based on completion
        termsAndConditions: termsAndConditionsFileUrl,
        cancellationPolicy: cancellationPolicyFileUrl,
        insurancePolicy: insurancePolicyFileUrl,
        agreementUrl: agreementUrl,
        agreementSignedAt: agreementSignedAt,
      },

      rating: 0, // Default rating
    });

    // Calculate profile completion
    const fieldsToCheck = [
      req.body.name,
      req.body.managerName,
      req.body.capacity,
      req.body.latitude,
      req.body.longitude,
      req.body.address,
      req.body.description,
      req.body.serviceAreas?.length > 0, // Add service areas check
      req.body.venueTypes?.length > 0,
      req.body.decorServices,
      req.body.catererServices,
      req.body.restrictionsPolicies?.length > 0,
      req.body.specialFeatures?.length > 0,
      req.body.audioVisualEquipment?.length > 0,
      req.body.accessibilityFeatures?.length > 0,
      req.body.facilities?.length > 0,
      photosUrl.length > 0,
      videosUrl.length > 0,
      req.body.instagramURL,
      req.body.websiteURL,
      req.body.awards,
      req.body.clientTestimonials,
      req.body.advanceBookingPeriod,
      req.body.priceStartingFrom,
      termsAndConditionsFileUrl,
      cancellationPolicyFileUrl,
    ];

    console.log(req.body);

    const completedFields = fieldsToCheck.filter((field) => field).length;
    const profileCompletion =
      Math.round((completedFields / fieldsToCheck.length) * 100) || 0;

    newVenue.basicDetails.profileCompletion = profileCompletion;

    // Save the new venue
    const savedVenue = await newVenue.save();

    // Update section completion
    await updateSectionCompletion(savedVenue.id);

    // Link the venue to the vendor (user)
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

    process.env.IS_DEV !== "true" && sendEmailToSlack({

      name: savedVenue.basicDetails.name,
      type: savedVenue.type,
    })
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

const getVenueById = async (req, res) => {
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

export default { createVenue, getAllVenues ,getVenueById};
