import propRental from "../../models/props.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
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
      getFileUrls(req.files, "audioVisualListUrl")[0] || req.body.audioVisualList;


    const termsAndConditionsUrl =
      getFileUrls(req.files, "termsAndConditions")[0] ||
      req.body.termsAndConditions;
    const cancellationPolicyUrl =
      getFileUrls(req.files, "cancellationPolicy")[0] ||
      req.body.cancellationPolicy;

    const itemCatalogueUrl =
      getFileUrls(req.files, "itemCatalogue")[0] || req.body.itemCatalogue;

      const photosUrls = getFileUrls(req.files, "photos");
    const photos = photosUrls.length ? photosUrls : req.body.photos || [];

    const videosUrls = getFileUrls(req.files, "videos");
    const videos = videosUrls.length ? videosUrls : req.body.videos || [];

    const newProp = new propRental({
      ...req.body,
      itemCatalogue: itemCatalogueUrl,
      customization: req.body.customization === "true",
      maintenance: req.body.maintenance,
      services: req.body.services,

      furnitureAndDecor: {
        listUrl:furnitureAndDecorListUrl,
        ...req.body.furnitureAndDecor,
      },
      tentAndCanopy: {
        listUrl:tentAndCanopyListUrl,
        ...req.body.tentAndCanopy,
      },
      audioVisual: {
        listUrl:audioVisualListUrl,
        ...req.body.audioVisual,
      },
      termsAndConditions: termsAndConditionsUrl,
      cancellationPolicy: cancellationPolicyUrl,
      photos: Array.isArray(photos) ? photos : [photos],
      videos: Array.isArray(videos) ? videos : [videos],
    });

    const savedProp = await newProp.save();
    res.status(201).json(savedProp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createProp };
