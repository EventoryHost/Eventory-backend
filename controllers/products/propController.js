import propRental from "../../models/props.js";
import { Vendor as User } from "../../models/users.js";

const getFileUrls = (files, fieldName) => {
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const calculateProfileCompletion = (basicDetails) => {
  const fields = ["managerName", "description", "eventSize"];
  const filledFields = fields.filter(
    (field) => basicDetails[field] && basicDetails[field].trim() !== ""
  );
  return Math.round((filledFields.length / fields.length) * 100);
};

const createProp = async (req, res) => {
  try {
    const furnitureAndDecorListUrl =
      getFileUrls(req.files, "furnitureAndDecorListUrl")[0] ||
      req.body.furnitureAndDecorList;

    const tentAndCanopyListUrl =
      getFileUrls(req.files, "tentAndCanopyListUrl")[0] ||
      req.body.tentAndCanopyList;

    const audioVisualListUrl =
      getFileUrls(req.files, "audioVisualListUrl")[0] ||
      req.body.audioVisualList;

    const termsAndConditionsUrl =
      getFileUrls(req.files, "termsAndConditions")[0] ||
      req.body.termsAndConditions;

    const cancellationPolicyUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;

    const itemCatalogueFile = req.files?.itemCatalogue?.[0];
    const itemCatalogueUrl = itemCatalogueFile
      ? itemCatalogueFile.location
      : req.body.itemCatalogue === "true"
      ? "true"
      : "false";

    const photosUrls = getFileUrls(req.files, "photos");
    const photosUrl = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videosUrl = videosUrls.length ? videosUrls : req.body.videos || [];

    const basicDetails = {
      managerName: req.body.managerName,
      description: req.body.descriptionOfWork,
      eventSize: req.body.eventSize,
    };

    const profileCompletion = calculateProfileCompletion(basicDetails);

    const newProp = new propRental({
      basicDetails: {
        ...basicDetails,
        profileCompletion,
      },
      serviceDetails: {
        itemCatalogue: itemCatalogueUrl,
        customization: req.body.customization === "true",
        maintenance: req.body.maintenance,
        services: req.body.services,
        serviceProvided: req.body.serviceProvided,
      },
      additionalDetails: {
        photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
        videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
        awardsAndRecognize: req.body.awardsAndRecognize,
        clientTestimonial: req.body.clientTestimonial,
        instaUrl: req.body.instaUrl,
        websiteUrl: req.body.websiteUrl,
        priceStartingFrom: req.body.priceStartingFrom,
      },
      ...req.body,
      furnitureAndDecor: {
        listUrl: furnitureAndDecorListUrl,
        ...req.body.furnitureAndDecor,
      },
      tentAndCanopy: {
        listUrl: tentAndCanopyListUrl,
        ...req.body.tentAndCanopy,
      },
      audioVisual: {
        listUrl: audioVisualListUrl,
        ...req.body.audioVisual,
      },
      policies: {
        termsAndConditions: termsAndConditionsUrl,
        cancellationPolicy: cancellationPolicyUrl,
      },
    });

    const savedProp = await newProp.save();
    const vendor = await User.findOne({ id: req.body.venId });
    if (!vendor) {
      await propRental.findByIdAndDelete(savedProp.id);
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.serviceIds.push({
      serType: "prop-rental",
      serId: savedProp.id,
    });
    await vendor.save();

    res.status(201).json(savedProp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllProp = async (req, res) => {
  try {
    const prop = await propRental.find();
    res.status(200).json(prop);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createProp, getAllProp };
