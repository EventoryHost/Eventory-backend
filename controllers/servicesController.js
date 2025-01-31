import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import propRental from "../models/props.js";
import { Service } from "../models/services.js";
import { Venue } from "../models/venue.js";

export const getService = async (req, res) => {
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

export const getVendorLimit = async (req, res) => {
  const { vendortype, vendorid } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;

  if (page <= 0 || limit <= 0) {
    return res
      .status(400)
      .json({ error: "Page and limit must be greater than 0" });
  }

  const skip = (page - 1) * limit;

  try {
    let model;

    const vendorModels = {
      Caterer: Caterer,
      Decorator: Decorator,
      "Venue Provider": Venue,
      "Prop Rental": propRental,
      "Photographers & Videographers": Photographer,
    };

    model = vendorModels[vendortype];
    if (!model) {
      return res.status(400).json({ error: "Invalid vendor type" });
    }

    const vendorData = await model
      .findOne({ id: vendorid })
      .skip(skip)
      .limit(limit);

    if (!vendorData) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const totalItems = await model.countDocuments({ id: vendorid });

    return res.status(200).json({
      data: vendorData,
      meta: {
        currentPage: page,
        limit: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred: " + error.message });
  }
};

export const addReviews = async (req, res) => {
  try {
    const { date, feedback, id, name, photos, rating, type } = req.body;
    if (!feedback && rating == 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!id || !Date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!rating) {
      return res.status(400).json({ message: "Rating is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!feedback) {
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

export const getAllServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;

    const skip = (page - 1) * itemsPerPage;

    const service = await Service.find().skip(skip).limit(itemsPerPage);

    const totalservices = await Service.countDocuments();

    res.status(200).json({
      data: service,
      currentPage: page,
      totalPages: Math.ceil(totalservices / itemsPerPage),
      totalItems: totalservices,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const handleSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required." });
    }

    const regex = new RegExp(`^${query}`, "i");
    const [venues, caterers, decorators, propRentals, pav] = await Promise.all([
      Venue.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      ),
      Caterer.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      ),
      Decorator.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      ),
      propRental
        .find({ "basicDetails.name": regex })
        .select("basicDetails.managerName vendorType id"),
      Photographer.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      ),
    ]);

    const results = [
      { serviceType: "Venue Provider", services: venues },
      { serviceType: "Caterer", services: caterers },
      { serviceType: "Decorators", services: decorators },
      { serviceType: "Prop Rental", services: propRentals },
      { serviceType: "Photographers & Videographers", services: pav },
    ];

    const filteredResults = results.filter(
      (group) => group.services.length > 0,
    );

    res.json({ results: filteredResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
