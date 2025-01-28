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
      description: req.body.description,
      termsAndConditions: termsAndConditionsUrls,
    });

    const savedGift = await newGift.save();
    res.status(201).json(savedGift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllGift = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const gifts = await Gift.find().skip(skip).limit(itemsPerPage);

    const totalgifts = await Gift.countDocuments();

    res.status(200).json({
      data: gifts,
      currentPage: page,
      totalPages: Math.ceil(totalgifts / itemsPerPage),
      totalItems: totalgifts,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createGift, getAllGift };
