import Caterer from "../models/caterer.js";

const createCaterer = async (req, res) => {
  const caterer = new Caterer(req.body);
  try {
    const newCaterer = await caterer.save();
    res.status(201).json(newCaterer);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getAllCaterers = async (req, res) => {
  try {
    const caterers = await res.json(caterers);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createCaterer, getAllCaterers };
