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
      portfolio: portfolioUrls,
    });

    const savedMakeupArtist = await newMakeupArtist.save();

    res.status(201).json(savedMakeupArtist);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { createMakeupArtist };
