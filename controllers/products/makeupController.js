import createMakeupArtistSchema from "../../models/makeupArtists.js";

const getFileUrls = (files, fieldName) => {
  return files[fieldName] ? files[fieldName].map((file) => file.location) : [];
};

const createMakeupArtist = async (req, res) => {
  try {
    const MakeupArtist = createMakeupArtistSchema(req.body.type);
    const alreadyExists = await MakeupArtist.findOne({
      name: req.body.name,
      id: req.body.venId,
    });
    if (alreadyExists) {
      return res.status(400).json({ message: "Makeup Artist already exists" });
    }

    const portfolioUrls = getFileUrls(req.files, "portfolio");

    const newMakeupArtist = new MakeupArtist({
      ...req.body,
      description: req.body.description,
      portfolio: portfolioUrls,
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllMakeupArtist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const caterers = await MakeupArtist.find().skip(skip).limit(itemsPerPage);

    const totalCaterers = await MakeupArtist.countDocuments();

    res.status(200).json({
      data: caterers,
      currentPage: page,
      totalPages: Math.ceil(totalCaterers / itemsPerPage),
      totalItems: totalCaterers,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createMakeupArtist, getAllMakeupArtist };
