import { Venue } from "../../models/venue.js";
import { Vendor as User } from "../../models/users.js";
import { Caterer } from "../../models/caterer.js";
import { Decorator } from "../../models/decoraters.js";
import Photographer from "../../models/photographers.js";
import PropRental from "../../models/props.js";

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

export const getAllVenues = async (req, res) => {
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
    const { id, name, rating, feedback, photos, type } = req.body;
    if (!id || !name || !rating || !feedback || !type) {
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
      });
      await photographer.save();
      res.status(200).json(photographer);
    } else if (type === "propRental") {
      const prop = PropRental.findOne({ id: id });
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
