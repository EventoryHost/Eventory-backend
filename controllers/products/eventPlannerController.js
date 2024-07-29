import EventPlanner from "../../models/eventPlanners.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createEventPlanner = async (req, res) => {
  try {
    const alreadyExists = await EventPlanner.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Event Planner already exists" });
    }

    const portfolioUrls =
      getFileUrls(req.files, "portfolio") || req.body.portfolio;
    const termsConditionsUrls =
      getFileUrls(req.files, "termsConditions") || req.body.termsConditions;
    const cancellationPolicyUrls =
      getFileUrls(req.files, "cancellationPolicy") ||
      req.body.cancellationPolicy;
    const insurancePolicyUrls =
      getFileUrls(req.files, "insurancePolicy") || req.body.insurancePolicy;
    const awardsUrls = getFileUrls(req.files, "awards") || req.body.awards;
    const clientTestimonialsUrls =
      getFileUrls(req.files, "clientTestimonials") ||
      req.body.clientTestimonials;
    const onlineRatingsUrls =
      getFileUrls(req.files, "onlineRatings") || req.body.onlineRatings;
    const privacyPolicyUrls =
      getFileUrls(req.files, "privacyPolicy") || req.body.privacyPolicy;

    const newEventPlanner = new EventPlanner({
      ...req.body,
      portfolio: portfolioUrls,
      termsConditions: termsConditionsUrls,
      cancellationPolicy: cancellationPolicyUrls,
      insurancePolicy: insurancePolicyUrls,
      awards: awardsUrls,
      clientTestimonials: clientTestimonialsUrls,
      onlineRatings: onlineRatingsUrls,
      privacyPolicy: privacyPolicyUrls,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createEventPlanner };
