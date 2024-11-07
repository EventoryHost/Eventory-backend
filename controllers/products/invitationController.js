import Invitation from "../../models/invitations.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createInvitation = async (req, res) => {
  try {
    const alreadyExists = await Invitation.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Invitation already exists" });
    }

    const clientTestimonialsUrls =
      getFileUrls(req.files, "clientTestimonials") ||
      req.body.clientTestimonials;

    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;
    const portfolioUrls = getFileUrls(req.files, "portfolio");

    const newInvitation = new Invitation({
      ...req.body,
      portfolio: portfolioUrls,
      description: req.body.description,
      termsAndConditions: termsAndConditionsFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
      clientTestimonials: clientTestimonialsUrls,
    });

    const savedInvitation = await newInvitation.save();
    res.status(201).json(savedInvitation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getAllInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.Invitation.find();
    res.status(200).json(invitation);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
export default { createInvitation, getAllInvitation };
