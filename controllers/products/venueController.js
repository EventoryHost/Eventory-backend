import { Venue } from "../../models/venue.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
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

      const photosUrls = getFileUrls(req.files, "photos") || req.body.photos;
      const videosUrls = getFileUrls(req.files, "videos") || req.body.videos;
      const insurancePolicyUrl = getFileUrls(req.files, "insurancePolicy") || req.body.insurancePolicy;

    const newVenue = new Venue({
      id: req.body.id,
      managerName: req.body.managerName,
      venId: req.body.venId,
      name: req.body.name,
      capacity: req.body.capacity,
      address: req.body.address,
      venueTypes: req.body.venueTypes,
      operatingHours: req.body.operatingHours,
      venueDescription: req.body.venueDescription,
      decorServices: req.body.decorServices,
      catererServices: req.body.catererServices,
      restrictionsPolicies: req.body.restrictionsPolicies,
      speacialFeatures: req.body.speacialFeatures,
      audioVisualEquipment: req.body.audioVisualEquipment,
      accessibilityFeatures: req.body.accessibilityFeatures,
      facilities: req.body.facilities,
      photos: photosUrls,
      videos: videosUrls,
      instagramURL: req.body.instagramURL,
      websiteURL: req.body.websiteURL,
      awards: req.body.awards,
      termsConditions: termsAndConditionsFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
      insurancePolicy: insurancePolicyUrl,
    });

    const savedVenue = await newVenue.save();
    res.status(201).json(savedVenue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllVenues = async (req, res) => {
  try {
    const Venues = await res.json(Venues);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createVenue };
