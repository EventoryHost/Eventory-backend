import Photographer from "../../models/photographers.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
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

    const portfolioUrl =
      getFileUrls(req.files, "portfolio") || req.body.portfolio;
    const clientTestimonialsUrl =
      getFileUrls(req.files, "clientTestimonials") ||
      req.body.clientTestimonials;
    const cancellationPolicyUrl =
      getFileUrls(req.files, "cancellationPolicy") ||
      req.body.cancellationPolicy;
    const termsAndConditionsUrl =
      getFileUrls(req.files, "termsAndConditions") ||
      req.body.termsAndConditions;

    const newPhotographer = new Photographer({
      ...req.body,
      portfolio: portfolioUrl,
      clientTestimonials: clientTestimonialsUrl,
      cancellationPolicy: cancellationPolicyUrl,
      termsAndConditions: termsAndConditionsUrl,
    });
    await newPhotographer.save();
    res.status(201).json({ message: "Photographer created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createPhotographer };
