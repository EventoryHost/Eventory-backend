import { Decorator } from "../../models/decoraters.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createDecorator = async (req, res) => {
  try {
    const alreadyExists = await Decorator.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Decorator already exists" });
    }

    const insuranceFileUrl =
      getFileUrls(req.files, "insurance")[0] || req.body.insurance;
    const awardsUrls = getFileUrls(req.files, "awards") || req.body.awards;
    const clientTestimonialsUrls =
      getFileUrls(req.files, "clientTestimonials") ||
      req.body.clientTestimonials;
    const onlineRatingsUrls =
      getFileUrls(req.files, "onlineRatings") || req.body.onlineRatings;
    const privacyPolicyFileUrl =
      getFileUrls(req.files, "privacyPolicy")[0] || req.body.privacyPolicy;
    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;
    const portfolioUrls = getFileUrls(req.files, "portfolio");

    const newDecorator = new Decorator({
      name: req.body.name,
      id: req.body.id,
      venId: req.body.venId,
      eventTypes: req.body.eventTypes,
      themesOffered: req.body.themesOffered,
      propSelection: req.body.propSelection,
      colorSchemeAssistance: req.body.colorSchemeAssistance,
      themeCustomization: req.body.themeCustomization,
      venueAdaptability: req.body.venueAdaptability,
      customDesignProcess: req.body.customDesignProcess,
      themeElements: req.body.themeElements,
      backdropOptions: req.body.backdropOptions,
      stageDecorationOptions: req.body.stageDecorationOptions,
      propAndAccessorySelection: req.body.propAndAccessorySelection,
      freeConsultation: req.body.freeConsultation,
      writtenThemeProposal: req.body.writtenThemeProposal,
      setupAndInstallation: req.body.setupAndInstallation,
      proposalRevisions: req.body.proposalRevisions,
      consultationProcess: req.body.consultationProcess,
      packageRates: req.body.packageRates,
      advancePayment: req.body.advancePayment,
      portfolio: portfolioUrls,
      clientTestimonials: clientTestimonialsUrls,
      onlineRatings: onlineRatingsUrls,
      awards: awardsUrls,
      insurancePolicy: insuranceFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
      termsAndConditions: termsAndConditionsFileUrl,
      privacyPolicy: privacyPolicyFileUrl,
    });

    const savedDecorator = await newDecorator.save();
    res.status(201).json(savedDecorator);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createDecorator };
