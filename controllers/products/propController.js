import propRental from "../../models/props.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createProp = async (req, res) => {
  try {
    const alreadyExists = await propRental.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Prop already exists" });
    }

    const furnitureAndDecorListUrl =
      getFileUrls(req.files, "furnitureAndDecorList") ||
      req.body.furnitureAndDecorList;

    const tentAndCanopyListUrl =
      getFileUrls(req.files, "tentAndCanopyList") || req.body.tentAndCanopyList;

    const audioVisualListUrl =
      getFileUrls(req.files, "audioVisualList") || req.body.audioVisualList;

    const privacyPolicyUrl =
      getFileUrls(req.files, "privacyPolicy") || req.body.privacyPolicy;

    const termsAndConditionsUrl =
      getFileUrls(req.files, "termsAndConditions") ||
      req.body.termsAndConditions;
    const cancellationPolicyUrl =
      getFileUrls(req.files, "cancellationPolicy") ||
      req.body.cancellationPolicy;
    const insurancePolicyUrl =
      getFileUrls(req.files, "insurancePolicy") || req.body.insurancePolicy;

    const newProp = new propRental({
      ...req.body,
      furnitureAndDecor: {
        ...req.body.furnitureAndDecor,
        listUrl: furnitureAndDecorListUrl,
      },
      tentAndCanopy: {
        ...req.body.tentAndCanopy,
        listUrl: tentAndCanopyListUrl,
      },
      audioVisual: {
        ...req.body.audioVisual,
        listUrl: audioVisualListUrl,
      },
      privacyPolicy: privacyPolicyUrl,
      termsAndConditions: termsAndConditionsUrl,
      cancellationPolicy: cancellationPolicyUrl,
      insurancePolicy: insurancePolicyUrl,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createProp };
