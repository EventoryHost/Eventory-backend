import { Venue } from "../models/venue.js";
import { Decorator } from "../models/decoraters.js";
import { Caterer } from "../models/caterer.js";
import Photographer from "../models/photographers.js";
import APIFeatures from "../utils/apiFeatures.js";

const searchVenues = async (query) => {
  const filters = {};

  // console.log(query);

  //handle price range
  if (query.minPrice || query.maxPrice) {
    filters["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      filters["additionalDetails.priceStartingFrom"].$gte = parseInt(
        query.minPrice,
        10,
      );
    if (query.maxPrice)
      filters["additionalDetails.priceStartingFrom"].$lte = parseInt(
        query.maxPrice,
        10,
      );
  }

  //handle guest capacity range
  if (query.minCapacity || query.maxCapacity) {
    const minCapacity = query.minCapacity
      ? parseInt(query.minCapacity, 10)
      : null;
    const maxCapacity = query.maxCapacity
      ? parseInt(query.maxCapacity, 10)
      : null;

    if (minCapacity !== null && maxCapacity !== null) {
      filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
      filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
    } else if (minCapacity !== null) {
      filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
    } else if (maxCapacity !== null) {
      filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
    }
  }

  //handle veneue types
  if (query.venueTypes) {
    query.venueTypes = query.venueTypes ? query.venueTypes.split(",") : [];
    filters["featureDetails.venueTypes"] = { $in: query.venueTypes };
  }

  // console.log("priyanshu", filters, "end");

  let venueQuery = Venue.find(filters);

  const apiFeatures = new APIFeatures(venueQuery, query)
    .sort()
    .limitFields()
    .paginate();

  const totalResults = await Decorator.countDocuments(filters); // Get total count
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const totalPages = Math.ceil(totalResults / limit);

  const data = await apiFeatures.query;

  return { data, totalResults, totalPages, currentPage: page };
};

const searchDecorators = async (query) => {
  const filters = {};
  if (query.minPrice || query.maxPrice) {
    filters["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      filters["additionalDetails.priceStartingFrom"].$gte = parseInt(
        query.minPrice,
        10,
      );
    if (query.maxPrice)
      filters["additionalDetails.priceStartingFrom"].$lte = parseInt(
        query.maxPrice,
        10,
      );
  }

  if (query.rating) {
    filters["rating"] = {};
    filters["rating"].$gte = parseInt(query.minPrice, 10);
  }

  // Handle themes offered
  if (query.themes) {
    query.themes = query.themes ? query.themes.split(",") : [];
    filters["themesOffered.themesOffered"] = { $in: query.themes };
  }


  let decoratorQuery = Decorator.find(filters);

  const apiFeatures = new APIFeatures(decoratorQuery, query)
    .sort()
    .limitFields()
    .paginate();

  const totalResults = await Decorator.countDocuments(filters); // Get total count
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const totalPages = Math.ceil(totalResults / limit);

  const data = await apiFeatures.query;

  return { data, totalResults, totalPages, currentPage: page };
};

const searchCaterers = async (query) => {
  // console.log("start", query, "End");
  const filters = {};

  // Handle price range
  if (query.minPrice || query.maxPrice) {
    filters["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      filters["additionalDetails.priceStartingFrom"].$gte = parseInt(
        query.minPrice,
        10,
      );
    if (query.maxPrice)
      filters["additionalDetails.priceStartingFrom"].$lte = parseInt(
        query.maxPrice,
        10,
      );
  }

  if (query.rating) {
    filters["rating"] = {};
    filters["rating"].$gte = parseInt(query.minPrice, 10);
  }

  // Handle guest capacity range
  if (query.minCapacity || query.maxCapacity) {
    const minCapacity = query.minCapacity
      ? parseInt(query.minCapacity, 10)
      : null;
    const maxCapacity = query.maxCapacity
      ? parseInt(query.maxCapacity, 10)
      : null;

    if (minCapacity !== null && maxCapacity !== null) {
      filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
      filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
    } else if (minCapacity !== null) {
      filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
    } else if (maxCapacity !== null) {
      filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
    }
  }

  if (query.cuisineSpecialities) {
    const cuisineList = query.cuisineSpecialities
      .split(",")
      .map((item) => item.trim());
    filters["basicDetails.cuisine_specialities"] = { $in: cuisineList };
  }

  if (query.vegOrNonVeg) {
    filters["menuDetails.vegOrNonVeg"] = query.vegOrNonVeg.toLowerCase();
  }

  let catererQuery = Caterer.find(filters);

  // console.log("priyanshu", filters, "end");

  const apiFeatures = new APIFeatures(catererQuery, query)
    .sort()
    .limitFields()
    .paginate();

  const totalResults = await Decorator.countDocuments(filters); // Get total count
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const totalPages = Math.ceil(totalResults / limit);

  const data = await apiFeatures.query;

  return { data, totalResults, totalPages, currentPage: page };
};

const searchPAV = async (query) => {
  const filters = {};

  // Handle price range
  if (query.minPrice || query.maxPrice) {
    filters["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      filters["additionalDetails.priceStartingFrom"].$gte = parseInt(
        query.minPrice,
        10,
      );
    if (query.maxPrice)
      filters["additionalDetails.priceStartingFrom"].$lte = parseInt(
        query.maxPrice,
        10,
      );
  }

  // Handle event types filtering
  if (query.eventTypes) {
    const eventList = query.eventTypes.split(",").map((item) => item.trim());
    filters["basicDetails.eventTypes"] = { $in: eventList };
  }

  // Handle services and styles filtering
  if (query.services) {
    const services = query.services.toLowerCase();
    if (services === "photography" || services === "videography") {
      const stylesField = `${services.charAt(0).toUpperCase() + services.slice(1)}.typesOfStyles`;
      if (query.styles) {
        const stylesList = query.styles.split(",").map((style) => style.trim());
        filters[stylesField] = { $in: stylesList };
      }
    } else if (services === "both") {
      const photoStylesField = "Photography.typesOfStyles";
      const videoStylesField = "Videography.typesOfStyles";
      if (query.styles) {
        const stylesList = query.styles.split(",").map((style) => style.trim());
        filters.$or = [
          { [photoStylesField]: { $in: stylesList } },
          { [videoStylesField]: { $in: stylesList } },
        ];
      }
    }
  }

  // console.log("priyanshu", filters, "end");

  let photographerQuery = Photographer.find(filters);

  const apiFeatures = new APIFeatures(photographerQuery, query)
    .sort()
    .limitFields()
    .paginate();

  const totalResults = await Decorator.countDocuments(filters); // Get total count
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const totalPages = totalResults / limit;

  const data = await apiFeatures.query;

  return { data, totalResults, totalPages, currentPage: page };
};

const searchAllVendors = async (query) => {
  try {
    const filters = {};

    // Handle price range filtering
    if (query.minPrice || query.maxPrice) {
      filters["additionalDetails.priceStartingFrom"] = {};
      if (query.minPrice)
        filters["additionalDetails.priceStartingFrom"].$gte = parseInt(
          query.minPrice,
          10,
        );
      if (query.maxPrice)
        filters["additionalDetails.priceStartingFrom"].$lte = parseInt(
          query.maxPrice,
          10,
        );
    }

    // Handle capacity filtering
    if (query.minCapacity || query.maxCapacity) {
      const minCapacity = query.minCapacity
        ? parseInt(query.minCapacity, 10)
        : null;
      const maxCapacity = query.maxCapacity
        ? parseInt(query.maxCapacity, 10)
        : null;

      if (minCapacity !== null && maxCapacity !== null) {
        filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
        filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
      } else if (minCapacity !== null) {
        filters["basicDetails.capacity.ul"] = { $gte: minCapacity };
      } else if (maxCapacity !== null) {
        filters["basicDetails.capacity.ll"] = { $lte: maxCapacity };
      }
    }

    // Handle event types filtering
    if (query.eventTypes) {
      query.eventTypes = query.eventTypes.split(",");
      filters["basicDetails.eventTypes"] = { $in: query.eventTypes };
    }

    // Sorting logic
    let sortStage = {};
    if (query.sort === "lth") {
      sortStage = { "additionalDetails.priceStartingFrom": 1 };
    } else if (query.sort === "htl") {
      sortStage = { "additionalDetails.priceStartingFrom": -1 };
    }

    // Pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 9;
    const skip = (page - 1) * limit;

    // Count total results
    const countPipeline = [
      { $match: filters },
      { $unionWith: { coll: "caterers", pipeline: [{ $match: filters }] } },
      { $unionWith: { coll: "decorators", pipeline: [{ $match: filters }] } },
      {
        $unionWith: { coll: "photographers", pipeline: [{ $match: filters }] },
      },
      { $count: "total" },
    ];

    const countResult = await Venue.aggregate(countPipeline);
    const totalResults = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalResults / limit);

    // Fetch filtered and paginated results
    const pipeline = [
      { $match: filters },
      { $unionWith: { coll: "caterers", pipeline: [{ $match: filters }] } },
      { $unionWith: { coll: "decorators", pipeline: [{ $match: filters }] } },
      {
        $unionWith: { coll: "photographers", pipeline: [{ $match: filters }] },
      },
      { $sort: sortStage }, // Apply sorting
      {
        $set: {
          vendorType: {
            $switch: {
              branches: [
                {
                  case: {
                    $gt: [{ $type: "$basicDetails.capacity" }, "missing"],
                  },
                  then: "Venue",
                },
                {
                  case: {
                    $gt: [{ $type: "$basicDetails.cuisineType" }, "missing"],
                  },
                  then: "Caterer",
                },
                {
                  case: {
                    $gt: [{ $type: "$basicDetails.decorType" }, "missing"],
                  },
                  then: "Decorator",
                },
              ],
              default: "Photographer",
            },
          },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const result = await Venue.aggregate(pipeline);

    return {
      data: result || [],
      totalResults,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Error fetching vendors");
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { type, start_date, end_date } = req.query;
    let results;

    switch (type) {
      case "all":
        results = await searchAllVendors(req.query);
        break;
      case "venues":
        results = await searchVenues(req.query);
        break;
      case "decorators":
        results = await searchDecorators(req.query);
        break;
      case "caterers":
        results = await searchCaterers(req.query);
        break;
      case "pav":
        results = await searchPAV(req.query);
        break;
      default:
        return res.status(400).json({ message: "Invalid Product type." });
    }

    // console.log("Initial results:", results);

    const { totalResults, totalPages, currentPage } = results;
    let { data = [] } = results; // Default to empty array if `data` is missing

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date();

    if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
    if (isNaN(endDate.getTime())) throw new Error("Invalid end date");

    if (!Array.isArray(data)) {
      throw new Error("Expected 'data' to be an array");
    }
    // console.log("Before modifying availability:", data);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      item.available = true;
      // console.log("Schedule for item:", item.basicDetails.name);

      if (!Array.isArray(item?.schedule) || item.schedule.length === 0) {
        item.available = true;
        continue;
      }

      let hasOverlap = false;
      for (let j = 0; j < item.schedule.length; j++) {
        const scheduleItem = item.schedule[j];

        // console.log(item.schedule[j]);

        if (!scheduleItem?.start || !scheduleItem?.end) continue;

        const itemStart = new Date(scheduleItem.start);
        const itemEnd = new Date(scheduleItem.end);

        if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) continue;

        if (itemStart < endDate && itemEnd > startDate) {
          hasOverlap = true;
          break;
        }
      }

      item.available = !hasOverlap;
      // console.log(item.available);
    }

    const resu = [...data]; // Ensure updated reference
    // console.log("Final results:", results);

    for (let i = 0; i < results.data.length; i++) {
      console.log("hello", resu[i].available);
      console.log(resu[i]);
    }

    res.status(200).json({
      message: "Search results fetched successfully.",
      size: data.length,
      totalResults,
      totalPages: 10,
      currentPage,
      results: resu,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Error fetching the results.",
    });
  }
};

export default searchProducts;
