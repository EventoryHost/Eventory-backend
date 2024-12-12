import { Venue } from "../../models/venue.js";
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
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;

    const photosUrls = getFileUrls(req.files, "photos");
    const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

    const insurancePolicyUrl =
      getFileUrls(req.files, "insurancePolicy")[0] || req.body.insurancePolicy;

    const newVenue = new Venue({
      id: req.body.id,
      venId: req.body.venId,

      basicDetails: {
        managerName: req.body.managerName,
        name: req.body.name,
        capacity: req.body.capacity,
        address: req.body.address,
        operatingHours: req.body.operatingHours,
        description: req.body.venueDescription,
      },
      featureDetails: {
        venueTypes: req.body.venueTypes,
        decorServices: req.body.decorServices,
        catererServices: req.body.catererServices,
        restrictionsPolicies: req.body.restrictionsPolicies,
        speacialFeatures: req.body.speacialFeatures,
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
        insurancePolicy: insurancePolicyUrl,
      },
    });

    const savedVenue = await newVenue.save();
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
    console.log(savedVenue);
    res.status(201).json(savedVenue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllVenues = async (req, res) => {
  try {
    const venue = await Venue.find();
    res.status(200).json(venue);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getVenueImages = async (req, res) => {
  try {
    const { id } = req.query;
    const venue = await Venue.findOne({ venId: id }).lean();

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

export default { createVenue, getAllVenues };
