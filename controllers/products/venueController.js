import Venue from "../../models/venue.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createVenue = async (req, res) => {
  try {
    const alreadyExists = await Venue.findOne({
      name: req.body.name,
      id: req.body.id,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Venue already exists" });
    }

    const termsAndConditionsFileUrl = getFileUrls( req.files, "termsConditions")[0] || req.body.termsConditions;
    const cancellationPolicyFileUrl = getFileUrls( req.files, "cancellationPolicy")[0] || req.body.cancellationPolicy;
    const portfolioUrls = getFileUrls( req.files, "portfolio");

    const newVenue = new Venue({
      id: req.body.id,
      name: req.body.name,
      venueType: req.body.venueType,
      operatingHours: req.body.operatingHours,
      venueDescription: req.body.venueDescription,
      seatedCapacity: req.body.seatedCapacity,
      standingCapacity: req.body.standingCapacity,
      decorServices: req.body.decorServices,
      audioVisualEquipment: req.body.audioVisualEquipment,
      accessibilityFeatures: req.body.accessibilityFeatures,
      facilities: req.body.facilities,
      termsConditions: termsAndConditionsFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
      rates: req.body.rates,
      media: req.body.media,
      portfolio: portfolioUrls,
      socialLinks: req.body.socialLinks,
      restrictionsPolicies: req.body.restrictionsPolicies,
      specialFeatures: req.body.specialFeatures,
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

export default {createVenue}
