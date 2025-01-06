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

  const requiredFields = Object.keys(section).filter(
    (key) => section[key] !== undefined && section[key] !== null && section[key] !== ""
  );

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
    venue.featureDetails.completed = checkCompletion(venue.featureDetails || {});
    venue.additionalDetails.completed = checkCompletion(venue.additionalDetails || {});
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

    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "termsConditions")[0] || req.body.termsConditions;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] || req.body.cancellationPolicy;

    const photosUrls = getFileUrls(req.files, "photos");
    const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

    const newVenue = new Venue({
      basicDetails: {
        managerName: req.body.managerName,
        name: req.body.name,
        capacity: req.body.capacity,
        address: req.body.address,
        operatingHours: req.body.operatingHours,
        description: req.body.description,
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
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
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

    const savedVenue = await newVenue.save();

    await updateSectionCompletion(savedVenue.id);

    res.status(201).json(savedVenue);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllVenues = async (req, res) => {
  try {
    const venues = await Venue.find();
    res.status(200).json(venues);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createVenue, getAllVenues };
