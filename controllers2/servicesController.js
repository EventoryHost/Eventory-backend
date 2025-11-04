
import Caterer from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import DjArtist from "../models2/djArtist.js";
import MakeupArtist from "../models2/makeupArtist.js";
import PhotographerVideographer from "../models2/photographerVideographer.js";
import Reviews from "../models2/reviews.js";
import VenueProvider from "../models2/venueProvider.js";
// import { Service } from "../models2/service.js";



export const getService = async (req, res) => {
  const vendor_type = req.params.vendor_type;
  const vendor_id = req.params.vendor_id;
  try {
    let vendorData;
    switch (vendor_type) {
      case "caterer":
        vendorData = await Caterer.findOne({ vendor_id: vendor_id });
        break;
      case "decorator":
        vendorData = await Decorator.findOne({ vendor_id: vendor_id });
        break;
      case "venue_provider":
        vendorData = await VenueProvider.findOne({ vendor_id: vendor_id });
        break;
      case "prop_rental":
        vendorData = await PropRental.findOne({ vendorData: vendor_id });
        break;
      case "photographer_videographer":
        vendorData = await PhotographerVideographer.findOne({ vendor_id: vendor_id });
        break;
      case "makeupartist":
        vendorData = await MakeupArtist.findOne({ vendor_id: vendor_id });
        break;
      case "dj_artist":
        vendorData = await DjArtist.findOne({ vendor_id: vendor_id });
        break;

      default:
        return res.status(400).json({ error: "Invalid vendor type" });
    }
    if (!vendorData) return res.status(404).json({ error: "Vendor not found" });
    return res.status(200).json(vendorData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred: " + error.message });
  }
};

export const getVendorLimit = async (req, res) => {
  const { vendor_type, vendor_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  console.log("🔥 Vendor type and ID:", vendor_type, vendor_id);
  console.log(`vendor_type in lowercase is ${vendor_type.toLowerCase()}`);

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
      caterer: Caterer,
      decorator: Decorator,
      venue_provider: VenueProvider,
      prop_rental: propRental,
      photographer_videographer: Photographer,
      makeupartist: MakeupArtist,
    };

    model = vendorModels[vendor_type.toLowerCase()];
    if (!model) {
      return res.status(400).json({ error: "Invalid vendor type" });
    }

    const vendorData = await model
      .findOne({ vendor_id })
      .skip(skip)
      .limit(limit);

    if (!vendorData) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const totalItems = await model.countDocuments({ id: vendor_id });

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
    const {
      service_id,
      customer_id,
      customer_name,
      service_type,
      rating,
      review,
      media_photo,
      media_video,
    } = req.body;

    if (
      !service_id ||
      !customer_id ||
      !customer_name ||
      !service_type ||
      !rating
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: service_id, customer_id, customer_name, service_type, rating",
      });
    }

    const newReview = new Reviews({
      service_id,
      customer_id,
      customer_name,
      service_type,
      rating,
      review,
      media_photo,
      media_video,
      // feedback_submitted_at is automatically handled by the schema's default
    });

    // Save the new review document to the 'reviews' collection
    await newReview.save();

    // Send the newly created review in the response
    res.status(201).json({
      message: "Review added successfully",
      data: newReview,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "An error occurred: " + error.message });
  }
};

// export const getAllServices = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const itemsPerPage = 9;

//     const skip = (page - 1) * itemsPerPage;

//     const service = await Service.find().skip(skip).limit(itemsPerPage);

//     const totalservices = await Service.countDocuments();

//     res.status(200).json({
//       data: service,
//       currentPage: page,
//       totalPages: Math.ceil(totalservices / itemsPerPage),
//       totalItems: totalservices,
//     });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

export const handleSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query parameter is required." });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const project = {
      "business_details.business_registration_name": 1,
      service_type: 1,
      service_id: 1,
      "basic_details.point_of_contact": 1,
      _id: 0,
    };

    const limitPerType = 8;

    const [venues, caterers, decorators, pavs, makeup, djs] = await Promise.all([
      VenueProvider.find({
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),

      Caterer.find({
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),

      Decorator.find({
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),

      PhotographerVideographer.find({
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),

      MakeupArtist.find({
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),

      DjArtist.find({                                         // NEW
        $or: [
          { "basic_details.point_of_contact": regex },
          { "business_details.business_registration_name": regex },
        ],
      }).select(project).limit(limitPerType).lean(),
    ]);

    const results = [
      { service_type: "venue_provider", services: venues },
      { service_type: "caterer", services: caterers },
      { service_type: "decorator", services: decorators },
      { service_type: "photographer_videographer", services: pavs },
      { service_type: "makeup_artist", services: makeup },
      { service_type: "dj_artist", services: djs },                 // NEW
    ].filter((g) => (g.services || []).length > 0);

    return res.status(200).json({ results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getServiceByServiceId = async (req, res) => {
  const { service_type, service_id } = req.params;
  console.log("📥 Received:", service_type, service_id);

  try {
    let serviceData;

    // Match service_type to the correct model
    switch (service_type.toLowerCase()) {
      case "caterer":
        serviceData = await Caterer.findOne({ service_id });
        break;
      case "decorator":
        serviceData = await Decorator.findOne({ service_id });
        break;
      case "venue_provider":
        serviceData = await VenueProvider.findOne({ service_id });
        break;
      case "photographer_videographer":
        serviceData = await PhotographerVideographer.findOne({ service_id });
        break;
      case "makeupartist":
        serviceData = await MakeupArtist.findOne({ service_id });
        break;
      case "dj_artist":
        serviceData = await DjArtist.findOne({ service_id }); // NEW
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
    return res
      .status(500)
      .json({ error: "An error occurred: " + error.message });
  }
};
//to be done
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