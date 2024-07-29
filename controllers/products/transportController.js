import Transport from "../../models/transport.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createTransport = async (req, res) => {
  try {
    const alreadyExists = await Transport.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Transport already exists" });
    }

    const cancellationPolicyFileUrl =
      getFileUrls(req.files, "cancellation_policy")[0] ||
      req.body.cancellation_policy;
    const termsAndConditionsFileUrl =
      getFileUrls(req.files, "terms_and_conditions")[0] ||
      req.body.terms_and_conditions;
    const portfolioUrls = getFileUrls(req.files, "portfolio");

    const newTransport = new Transport({
      contactPersonName: req.body.contactPersonName,
      numberOfWorkers: req.body.numberOfWorkers,
      descriptionOfPastWork: req.body.descriptionOfPastWork,
      portfolio: portfolioUrls,
      heavyVehicles: req.body.heavyVehicles,
      vehicleTypes: req.body.vehicleTypes,
      brands: req.body.brands,
      models: req.body.models,
      packageRates: req.body.packageRates,
      advancePayment: req.body.advancePayment,
      termsAndConditions: termsAndConditionsFileUrl,
      cancellationPolicy: cancellationPolicyFileUrl,
    });

    const savedTransport = await newTransport.save();
    res.status(201).json(savedTransport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createTransport };
