import Photographer from "../../models/photographers.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createPhotographer = async (req, res) => {
  try {
    // Check if the photographer already exists based on name and vendor ID
    const alreadyExists = await Photographer.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Photographer already exists" });
    }

    // Process file uploads if available
    const photosUrls = getFileUrls(req.files, "photos")[0] || req.body.photos;
    const videosUrls = getFileUrls(req.files, "videos")[0] || req.body.videos;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "termsAndConditions")[0] ||
      req.body.termsAndConditions;
    // Create a new photographer with provided data
    const newPhotographer = new Photographer({
      ...req.body,
      photos: photosUrls,
      videos: videosUrls,
      cancellationPolicy : cancellationPolicyFileUrl,
      termsAndConditions : termsAndConditionsFileUrl
    });

    // Save the photographer to the database
    await newPhotographer.save();
    res.status(201).json({ message: "Photographer created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch all photographers
const getAllPav = async (req, res) => {
  try {
    const pav = await Photographer.find();
    res.status(200).json(pav);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createPhotographer, getAllPav };
