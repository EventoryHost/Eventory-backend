import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import propRental from "../models/props.js";
import { Service } from "../models/services.js";
import { Venue } from "../models/venue.js";
import MakeupArtist from "../models/makeupArtists.js";
import DjArtist from "../models/djArtist.js";

const prefixToModelMap = {
  cat: { Model: Caterer, vendorType: "caterer" },
  dec: { Model: Decorator, vendorType: "decorator" },
  mak: { Model: MakeupArtist, vendorType: "makeup" },
  pav: { Model: Photographer, vendorType: "photographer" },
  veu: { Model: Venue, vendorType: "venue" },
  dj: { Model: DjArtist, vendorType: "dj" },
  // future vendors can be added here (e.g., mc: { Model: MCAnchor, vendorType: "mc" })
};
function modelFromServiceId(serviceId) {
  if (!serviceId || typeof serviceId !== "string") return null;

  const lowerId = serviceId.toLowerCase();

  // find the first matching prefix dynamically
  for (const prefix of Object.keys(prefixToModelMap)) {
    if (lowerId.startsWith(prefix)) {
      return prefixToModelMap[prefix];
    }
  }

  return null; // no matching vendor
}

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
      case "Makeup-Artist":
        vendorData = await MakeupArtist.findOne({ id: vendorid });
        break;
      case "DJ-Vendor":
        vendorData = await DjArtist.findOne({ id: vendorid });
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

  if (page == 0) {
  }

  if (page < 0 || limit <= 0) {
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
      "Makeup Artist": MakeupArtist,
      "DJ-Vendor": DjArtist,
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

    if (!id || !date || !name || (!feedback && rating === 0)) {
      return res.status(400).json({ message: "Missing required fields" });
    }


    const models = {
      venue: Venue,
      caterer: Caterer,
      decorator: Decorator,
      photographer: Photographer,
      propRental: propRental,
      makeupArtist: MakeupArtist,
      djArtist: DjArtist,
    };

    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ message: "Invalid type provided" });
    }

    const entity = await Model.findOne({ id });
    if (!entity) {
      return res.status(404).json({ message: `${type} not found` });
    }

    entity.reviews = entity.reviews || [];
    entity.reviews.push({ rating, name, feedback, photos, date });


    await entity.save();

    res.status(200).json(entity);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const [venues, caterers, decorators, propRentals, pav, makeupArtists,djVendors] = await Promise.all([
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
      MakeupArtist.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      ),
      DjArtist.find({ "basicDetails.name": regex }).select(
        "basicDetails.name vendorType id",
      )
    ]);

    const results = [
      { serviceType: "Venue Provider", services: venues },
      { serviceType: "Caterer", services: caterers },
      { serviceType: "Decorators", services: decorators },
      { serviceType: "Prop Rental", services: propRentals },
      { serviceType: "Photographers & Videographers", services: pav },
      { serviceType: "Makeup-Artist", services: makeupArtists },
      { serviceType: "DJ-Vendor", services: djVendors },
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

export const getServiceByServiceId = async (req, res) => {
  const { serviceType, serviceId } = req.params;

  try {
    let serviceData;

    // Match serviceType to the correct model
    switch (serviceType) {
      case "Caterer":
        serviceData = await Caterer.findOne({ id: serviceId });
        break;
      case "Decorator":
        serviceData = await Decorator.findOne({ id: serviceId });
        break;
      case "Venue Provider":
        serviceData = await Venue.findOne({ id: serviceId });
        break;
      case "Prop Rental":
        serviceData = await propRental.findOne({ id: serviceId });
        break;
      case "Photographers & Videographers":
        serviceData = await Photographer.findOne({ id: serviceId });
        break;
      case "Makeup-Artist":
        serviceData = await MakeupArtist.findOne({ id: serviceId });
        break;
      case "DJ-Vendor":
        serviceData = await DjArtist.findOne({ id: serviceId });
        break;
      default:
        return res.status(400).json({ error: "Invalid service type" });
    }

    // Check if the service was found
    if (!serviceData) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Respond with service data
    return res.status(200).json(serviceData);
  } catch (error) {
    console.error("❌ Error fetching service:", error);
    return res.status(500).json({ error: "An error occurred: " + error.message });
  }
};


export const updateScheduleColor = async (req, res) => {
  const { serviceId, eventId } = req.params;
  try {
    const resolver = modelFromServiceId(serviceId);
    if (!resolver) {
      return res.status(400).json({ error: "Invalid serviceId prefix" });
    }
    const { Model } = resolver;

    const updatedService = await Model.findOneAndUpdate(
      { id: serviceId, "schedule.id": eventId },
      { $set: { "schedule.$.color": "green" } },
      { new: true }
    ).lean();

    if (!updatedService) {
      return res.status(404).json({ error: "Service or schedule event not found" });
    }

    return res.status(200).json({ message: "Schedule event color updated", data: updatedService });
  } catch (error) {
    console.error("Error updating schedule color:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};