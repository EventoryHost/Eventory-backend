const Caterer = require("../models/caterer");

createCaterer = async (req, res) => {
  const caterer = new Caterer(req.body);
  try {
    const newCaterer = await caterer.save();
    res.status(201).json(newCaterer);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


getAllCaterers = async (req, res) => {

    try{
        const caterers = await Caterer.
        res.json(caterers)
    } catch (e) {
        res.status(400).json({ message: e.message})
    }
}

module.exports = {createCaterer, getAllCaterers}