import Gift from "../../models/gift.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createGift = async (req, res) => {
  try {
    const alreadyExists = await Gift.findOne({
      name: req.body.name,
      venId: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Gift already exists" });
    }

    const giftImagesUrls =
      getFileUrls(req.files, "giftImages") || req.body.giftImages;

    const termsAndConditionsUrls =
      getFileUrls(req.files, "termsAndConditions") ||
      req.body.termsAndConditions;

    const newGift = new Gift({
      ...req.body,
      giftImages: giftImagesUrls,
      termsAndConditions: termsAndConditionsUrls,
    });

    const savedGift = await newGift.save();
    res.status(201).json(savedGift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createGift };
