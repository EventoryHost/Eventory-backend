
import Caterer from "../models/caterer.js";
import { Decorator } from "../models/decorator.js";
import DjArtist from "../models/djArtist.js";
import MakeupArtist from "../models/makeupArtist.js";
import PhotographerVideographer from "../models/photographerVideographer.js";
import Reviews from "../models/reviews.js";
import VenueProvider from "../models/venueProvider.js";
// import { Service } from "../models/service.js";



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
        return res.status(400).json({ message: "Prop rental service is not available" });
        break;
      case "photographer_videographer":
        vendorData = await PhotographerVideographer.findOne({ vendor_id: vendor_id });
        break;
      case "makeupartist":
        vendorData = await MakeupArtist.findOne({ vendor_id: vendor_id });
        break;
      case "dj_artist":
      case "dj":
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
      dj_artist: DjArtist,
      dj: DjArtist,
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

/**
 * Get all services from all models with optional category filtering
 * @route GET /api/services/all
 * @query category - Optional filter by category (caterer, decorator, venue_provider, photographer_videographer, makeupartist, dj_artist, all)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query search - Search across vendor ID, vendor names, mobile, email
 * @query sortBy - Field to sort by (default: vendor_name)
 * @query order - Sort order: asc/desc (default: asc)
 * @query fields - Comma-separated fields to return
 */
export const getAllServices = async (req, res) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 20, 
      search = '', 
      location = '',
      sortBy = 'vendor_name', 
      order = 'asc',
      fields 
    } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order.toLowerCase() === 'desc' ? -1 : 1;
    
    const serviceModels = {
      caterer: Caterer,
      decorator: Decorator,
      venue_provider: VenueProvider,
      photographer_videographer: PhotographerVideographer,
      makeupartist: MakeupArtist,
      dj_artist: DjArtist
    };

    const searchFilter = search ? {
      $or: [
        { vendor_id: { $regex: search, $options: 'i' } },
        { service_id: { $regex: search, $options: 'i' } },
        { "business_details.business_registration_name": { $regex: search, $options: 'i' } },
        { "basic_details.point_of_contact": { $regex: search, $options: 'i' } },
        { "basic_details.venue_name": { $regex: search, $options: 'i' } },
        { service_type: { $regex: search, $options: 'i' } },
        { vendor_name: { $regex: search, $options: 'i' } },
        { vendor_mobile: { $regex: search, $options: 'i' } },
        { email_address: { $regex: search, $options: 'i' } }
      ]
    } : null;

    // Location filter: searches across business address, operational cities, service areas,
    // and category-specific service location address fields
    const locationFilter = location ? {
      $or: [
        { "business_details.business_address": { $regex: location, $options: 'i' } },
        { "business_details.operational_cities": { $regex: location, $options: 'i' } },
        { service_areas: { $regex: location, $options: 'i' } },
        // Category-specific service location address fields
        { "basic_details.service_location_caterer.service_address": { $regex: location, $options: 'i' } },
        { "basic_details.service_location_venue.service_address": { $regex: location, $options: 'i' } },
        { "basic_details.service_location_dj_artist.service_address": { $regex: location, $options: 'i' } },
        { "basic_details.service_location_decorator.service_address": { $regex: location, $options: 'i' } },
        { "basic_details.service_location_photographer.service_address": { $regex: location, $options: 'i' } },
        { "basic_details.service_location_makeupartist.service_address": { $regex: location, $options: 'i' } },
        // Also search by pincode (business and service)
        ...((/^\d+$/.test(location)) ? [
          { "business_details.pincode": parseInt(location) },
          { "basic_details.service_location_caterer.service_pincode": parseInt(location) },
          { "basic_details.service_location_venue.service_pincode": parseInt(location) },
          { "basic_details.service_location_dj_artist.service_pincode": parseInt(location) },
          { "basic_details.service_location_decorator.service_pincode": parseInt(location) },
          { "basic_details.service_location_photographer.service_pincode": parseInt(location) },
          { "basic_details.service_location_makeupartist.service_pincode": parseInt(location) },
        ] : [])
      ]
    } : null;

    // Combine search and location filters with $and if both are present
    let searchQuery = {};
    const conditions = [searchFilter, locationFilter].filter(Boolean);
    if (conditions.length === 1) {
      searchQuery = conditions[0];
    } else if (conditions.length > 1) {
      searchQuery = { $and: conditions };
    }

    let selectFields = {};
    if (fields) {
      const fieldArray = fields.split(',').map(f => f.trim());
      fieldArray.forEach(field => {
        selectFields[field] = 1;
      });
    }

    let allServices = [];
    let totalCount = 0;

    if (category && category.toLowerCase() !== 'all') {
      const normalizedCategory = category.toLowerCase();
      const Model = serviceModels[normalizedCategory];
      
      if (!Model) {
        return res.status(400).json({ 
          error: "Invalid category",
          validCategories: [...Object.keys(serviceModels), 'all']
        });
      }

      totalCount = await Model.countDocuments(searchQuery);

      const query = Model.find(searchQuery)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean();

      if (fields) {
        query.select(selectFields);
      }

      const services = await query;
      allServices = services.map(service => ({
        ...service,
        category: normalizedCategory
      }));
    } else {
      const fetchPromises = Object.entries(serviceModels).map(async ([categoryName, Model]) => {
        const count = await Model.countDocuments(searchQuery);
        const query = Model.find(searchQuery).lean();
        
        if (fields) {
          query.select(selectFields);
        }
        
        const services = await query;
        return {
          services: services.map(service => ({
            ...service,
            category: categoryName
          })),
          count
        };
      });

      const results = await Promise.all(fetchPromises);
      
      const combinedServices = results.flatMap(r => r.services);
      totalCount = results.reduce((sum, r) => sum + r.count, 0);
      
      let filteredServices = combinedServices;
      // if (search) {









      
      filteredServices.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        if (typeof aVal === 'string') {
          return sortOrder === 1 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortOrder === 1 ? aVal - bVal : bVal - aVal;
      });
      
      allServices = filteredServices.slice(skip, skip + limitNum);
    }

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      category: category || 'all',
      count: totalCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      data: allServices
    });
  } catch (error) {
    console.error("Error fetching all services:", error);
    return res.status(500).json({ 
      error: "An error occurred while fetching services",
      message: error.message 
    });
  }
};