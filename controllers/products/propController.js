import propRental from "../../models/props.js";

const getFileUrls = (files, fieldName) => {
  // Handle cases where there might be a single file instead of an array of files
  const fileArray = files[fieldName];
  if (fileArray) {
    return Array.isArray(fileArray)
      ? fileArray.map((file) => file.location)
      : [fileArray.location];
  }
  return [];
};

const createProp = async (req, res) => {
  try {
    // const alreadyExists = await propRental.findOne({
    //   name: req.body.name,
    //   venId: req.body.venId,
    // });
    // if (alreadyExists) {
    //   return res.status(400).json({ message: "Prop Rental already exists" });
    // }

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

    const newProp = new propRental({
      ...req.body,
      itemCatalogue: itemCatalogueUrl,
      customization: req.body.customization === "true",
      maintenance: req.body.maintenance,
      services: req.body.services,
      description: req.body.descriptionOfWork,

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
      termsAndConditions: termsAndConditionsUrl,
      cancellationPolicy: cancellationPolicyUrl,
      photos: Array.isArray(photosUrl) ? photosUrl : [photosUrl],
      videos: Array.isArray(videosUrl) ? videosUrl : [videosUrl],
    });

    const savedProp = await newProp.save();
    // console.log(newProp);
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
