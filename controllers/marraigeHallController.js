import Hall from "../models/marraigehall.js";

const createHall = async (req, res) => {
  const hall = new Hall(req.body);
  try {
    const newHall = await hall.save();
    res.status(201).json(newHall);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getAllHalls = async (req, res) => {
  try {
    const halls = await find();
    res.json(halls);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export default { createHall, getAllHalls };
