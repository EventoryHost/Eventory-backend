import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import propRental from "../models/props.js";
import { Venue } from "../models/venue.js";

const getService = async (req, res) => {
  const { vendortype, vendorid } = req.params;

  try {
    let vendorData;

    // Fetch data based on vendor type
    switch (vendortype) {
      case "Caterer":
        vendorData = await Caterer.findOne({ id: vendorid });
        break;
      case "Decorator":
        vendorData = await Decorator.findOne({ id: vendorid });
        break;
      case "Venue Provider":
        vendorData = await Venue.findOne({ id: vendorid });
        break;
      case "Prop Rental":
        vendorData = await propRental.findOne({ id: vendorid });
        break;
      case "Photographers & Videographers":
        vendorData = await Photographer.findOne({ id: vendorid });
        break;
      default:
        return res.status(400).json({ error: "Invalid vendor type" });
    }

    // Check if vendor data exists
    if (!vendorData) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Send vendor data as response
    return res.status(200).json(vendorData);
  } catch (error) {
    // Handle errors
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred: " + error.message });
  }
};


export const addReviews = async (req, res) => {
  try {
    const { date, feedback, id, name, photos, rating, type } = req.body;
    if(!feedback && rating == 0){
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!id || !Date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if(!rating){
      return res.status(400).json({ message: "Rating is required" });
    }
    if(!name){
      return res.status(400).json({ message: "Name is required" });
    }
    if(!feedback){
      return res.status(400).json({ message: "Feedback is required" });
    }

    if (type === "venue") {
      const venue = await Venue.findOne({ id: id });
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      if (!venue.reviews) {
        venue.reviews = [];
      }
      venue.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await venue.save();
      res.status(200).json(venue);
    } else if (type === "caterer") {
      const caterer = await Caterer.findOne({ id: id });
      if (!caterer) {
        return res.status(404).json({ message: "Caterer not found" });
      }
      if (!caterer.reviews) {
        caterer.reviews = [];
      }
      caterer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await caterer.save();
      res.status(200).json(caterer);
    } else if (type === "decorator") {
      const decorator = await Decorator.findOne({ id: id });
      if (!decorator) {
        return res.status(404).json({ message: "Decorator not found" });
      }
      if (!decorator.reviews) {
        decorator.reviews = [];
      }
      decorator.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await decorator.save();
      res.status(200).json(decorator);
    } else if (type === "photographer") {
      const photographer = await Photographer.findOne({ id: id });
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      if (!photographer.reviews) {
        photographer.reviews = [];
      }
      photographer.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await photographer.save();
      res.status(200).json(photographer);
    } else if (type === "propRental") {
      const prop = await propRental.findOne({ id: id });
      if (!prop) {
        return res.status(404).json({ message: "Prop Rental not found" });
      }
      if (!prop.reviews) {
        prop.reviews = [];
      }
      prop.reviews.push({
        rating,
        name,
        feedback,
        photos,
        date,
      });
      await prop.save();
      res.status(200).json(prop);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { getService };
