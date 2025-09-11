import mongoose from "mongoose";
import { Venue } from "../models/venue.js";
import { Decorator } from "../models/decoraters.js";
import { Caterer } from "../models/caterer.js";
import Photographer from "../models/photographers.js";
import DjArtist from "../models/djArtist.js";
import APIFeatures from "../utils/apiFeatures.js";
import MakeupArtist from "../models/makeupArtists.js";
import { pincodeMap } from "../constants/pincodes_map.js";

const getPincodesList = async (cityName) => {
  try {
    return pincodeMap[cityName];
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    return [];
  }
};

const searchVenues = async (query) => {
  const matchStage = {};

  const location = query.location;

  // Type of Event
  if (query.typeOfEvent && query.typeOfEvent !== "All") {
    matchStage["featureDetails.eventTypes"] = { $in: [query.typeOfEvent] };
  }

  // Price Range
  if (query.minPrice || query.maxPrice) {
    matchStage["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      matchStage["additionalDetails.priceStartingFrom"].$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice)
      matchStage["additionalDetails.priceStartingFrom"].$lte = parseInt(query.maxPrice, 10);
  }

  // Guest Capacity
  const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
  const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;
  if (minCapacity !== null && maxCapacity !== null) {
    matchStage["basicDetails.capacity.ll"] = { $lte: maxCapacity };
    matchStage["basicDetails.capacity.ul"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basicDetails.capacity.ul"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basicDetails.capacity.ll"] = { $lte: maxCapacity };
  }

  // Venue Types
  if (query.venueTypes) {
    const types = query.venueTypes.split(",").map((v) => v.trim());
    matchStage["featureDetails.venueTypes"] = { $in: types };
  }

  // Rating
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Add location relevance if location is provided
  if (location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [location, { $ifNull: ["$basicDetails.serviceAreas", []] }]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Continue with pagination
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit]
                }
              }
            }
          }
        ],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  const result = await Venue.aggregate(pipeline);

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};


const searchDecorators = async (query) => {
  const matchStage = {};

  const location = query.location;

  // Event type
  if (query.typeOfEvent && query.typeOfEvent !== "All") {
    matchStage["basicDetails.eventTypes"] = { $in: [query.typeOfEvent] };
  }

  // Price range
  if (query.minPrice || query.maxPrice) {
    matchStage["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      matchStage["additionalDetails.priceStartingFrom"].$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice)
      matchStage["additionalDetails.priceStartingFrom"].$lte = parseInt(query.maxPrice, 10);
  }

  // Rating
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  // Themes
  if (query.themes) {
    const themeList = query.themes.split(",").map((theme) => theme.trim());
    matchStage["themesOffered.themesOffered"] = { $in: themeList };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Prioritize location-based sorting
  if (location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [location, { $ifNull: ["$basicDetails.serviceAreas", []] }]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Pagination with metadata
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit]
                }
              }
            }
          }
        ],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  const result = await Decorator.aggregate(pipeline);

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};

const searchCaterers = async (query) => {
  const matchStage = {};

  const location = query.location;

  // Event Type
  if (query.typeOfEvent && query.typeOfEvent !== "All") {
    matchStage["eventDetails.event_types_catered"] = { $in: [query.typeOfEvent] };
  }

  // Price range
  if (query.minPrice || query.maxPrice) {
    matchStage["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      matchStage["additionalDetails.priceStartingFrom"].$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice)
      matchStage["additionalDetails.priceStartingFrom"].$lte = parseInt(query.maxPrice, 10);
  }

  // Rating
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  // Guest capacity
  const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
  const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;
  if (minCapacity !== null && maxCapacity !== null) {
    matchStage["basicDetails.capacity.ll"] = { $lte: maxCapacity };
    matchStage["basicDetails.capacity.ul"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basicDetails.capacity.ul"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basicDetails.capacity.ll"] = { $lte: maxCapacity };
  }

  // Cuisine specialities
  if (query.cuisineSpecialities) {
    const cuisineList = query.cuisineSpecialities.split(",").map((item) => item.trim());
    matchStage["basicDetails.cuisine_specialities"] = { $in: cuisineList };
  }

  // Veg / Non-Veg
  if (query.vegOrNonVeg) {
    matchStage["menuDetails.vegOrNonVeg"] = query.vegOrNonVeg.toLowerCase();
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchStage }
  ];

  // Add location-based sorting if location is provided
  if (location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [
                  location,
                  { $ifNull: ["$basicDetails.serviceAreas", []] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Continue with pagination
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit]
                }
              }
            }
          }
        ],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  const result = await Caterer.aggregate(pipeline);

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};

const searchPAV = async (query) => {
  const matchStage = {};

  const location = query.location;

  // Type of Event
  if (query.typeOfEvent && query.typeOfEvent !== "All") {
    matchStage["basicDetails.eventTypes"] = { $in: [query.typeOfEvent] };
  }

  // Price Range
  if (query.minPrice || query.maxPrice) {
    matchStage["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      matchStage["additionalDetails.priceStartingFrom"].$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice)
      matchStage["additionalDetails.priceStartingFrom"].$lte = parseInt(query.maxPrice, 10);
  }

  // Event Types
  if (query.eventTypes) {
    const eventList = query.eventTypes.split(",").map((item) => item.trim());
    matchStage["basicDetails.eventTypes"] = { $in: eventList };
  }

  // Services + Styles
  if (query.services) {
    const services = query.services.toLowerCase();
    if (services === "photography" || services === "videography") {
      const stylesField = `${services.charAt(0).toUpperCase() + services.slice(1)}.typesOfStyles`;
      if (query.styles) {
        const stylesList = query.styles.split(",").map((style) => style.trim());
        matchStage[stylesField] = { $in: stylesList };
      }
    } else if (services === "both" && query.styles) {
      const stylesList = query.styles.split(",").map((style) => style.trim());
      matchStage.$or = [
        { "Photography.typesOfStyles": { $in: stylesList } },
        { "Videography.typesOfStyles": { $in: stylesList } }
      ];
    }
  }

  // Rating
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Add location-based prioritization
  if (location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [location, { $ifNull: ["$basicDetails.serviceAreas", []] }]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { isMatch: -1 } }
    );
  }

  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit]
                }
              }
            }
          }
        ],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  const result = await Photographer.aggregate(pipeline);

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};

const searchMakeupArtists = async (query) => {
  const matchStage = {};

  const location = query.location;

  // Type of Event
  if (query.typeOfEvent && query.typeOfEvent !== "All") {
    matchStage["featureDetails.eventTypes"] = { $in: [query.typeOfEvent] };
  }

  // Price Range
  if (query.minPrice || query.maxPrice) {
    matchStage["additionalDetails.priceStartingFrom"] = {};
    if (query.minPrice)
      matchStage["additionalDetails.priceStartingFrom"].$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice)
      matchStage["additionalDetails.priceStartingFrom"].$lte = parseInt(query.maxPrice, 10);
  }

  // Event Size / Capacity
  const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
  const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;
  if (minCapacity !== null && maxCapacity !== null) {
    matchStage["basicDetails.eventSize.ll"] = { $lte: maxCapacity };
    matchStage["basicDetails.eventSize.ul"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basicDetails.eventSize.ul"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basicDetails.eventSize.ll"] = { $lte: maxCapacity };
  }

  // Types of Makeup Artists
  if (query.typesOfMakeupArtists) {
    const types = query.typesOfMakeupArtists.split(",").map((t) => t.trim());
    matchStage["basicDetails.typesOfMakeupArtists"] = { $in: types };
  }

  // Service Types
  if (query.serviceTypes) {
    const services = query.serviceTypes.split(",").map((t) => t.trim());
    matchStage["serviceDetails.serviceTypes"] = { $in: services };
  }

  // Rating
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Location prioritization
  if (location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [location, { $ifNull: ["$basicDetails.serviceAreas", []] }]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Pagination and metadata
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit]
                }
              }
            }
          }
        ],
        data: [
          { $skip: skip },
          { $limit: limit }
        ]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  const result = await MakeupArtist.aggregate(pipeline);

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};

const searchAllVendors = async (query) => {
  try {
    const filters = {};

    if (query.location) {
      const cityName = query.location;
      filters["basicDetails.serviceAreas"] = cityName;
    }

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

    if (query.rating) {
      let rating = parseInt(query.rating, 10);
      filters["rating"] = {};
      if (rating === 0) {
        filters["rating"].$lt = 1;
      } else {
        filters["rating"].$gte = parseInt(query.rating, 10);
      }
    }

    // Sorting logic
    let sortStage = {};
    if (query.sort === "lth") {
      sortStage = { "additionalDetails.priceStartingFrom": 1 };
    } else if (query.sort === "htl") {
      sortStage = { "additionalDetails.priceStartingFrom": -1 };
    } else {
      sortStage = { _id: -1 };
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
      {
        $unionWith: { coll: "makeupartists", pipeline: [{ $match: filters }] },
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
      {
        $unionWith: { coll: "makeupartists", pipeline: [{ $match: filters }] },
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
                {
                  case: {
                    $gt: [{ $type: "$basicDetails.makeupType" }, "missing"],
                  },
                  then: "MakeupArtist",
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

const searchDjArtists = async (query) => {
  const matchStage = {};
  const location = query.location ? String(query.location).trim() : null;

  // ---- Event type (support both param names to be safe) ----
  const eventTypeParam = query.typeOfEvent || query.typeEvent;
  if (eventTypeParam && eventTypeParam !== "All") {
    matchStage["serviceDetails.eventTypes"] = { $in: [eventTypeParam] };
  }

  // ---- Price range (correct field path) ----
  if (query.minPrice || query.maxPrice) {
    const priceFilter = {};
    if (query.minPrice) priceFilter.$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice) priceFilter.$lte = parseInt(query.maxPrice, 10);
    matchStage["additionalDetails.priceStartingFrom"] = priceFilter;
  }

  // ---- Capacity (optional / flexible) ----
  // Many DJ docs don't have capacity; we'll add flexible filters that check
  // both basicDetails.capacity and basicDetails.eventSize if user provided capacities.
  const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
  const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;
  if (minCapacity !== null || maxCapacity !== null) {
    const capacityOr = [];
    if (minCapacity !== null && maxCapacity !== null) {
      capacityOr.push({
        "basicDetails.capacity.ll": { $lte: maxCapacity },
        "basicDetails.capacity.ul": { $gte: minCapacity }
      });
      capacityOr.push({
        "basicDetails.eventSize.ll": { $lte: maxCapacity },
        "basicDetails.eventSize.ul": { $gte: minCapacity }
      });
    } else if (minCapacity !== null) {
      capacityOr.push({ "basicDetails.capacity.ul": { $gte: minCapacity } });
      capacityOr.push({ "basicDetails.eventSize.ul": { $gte: minCapacity } });
    } else { // only maxCapacity
      capacityOr.push({ "basicDetails.capacity.ll": { $lte: maxCapacity } });
      capacityOr.push({ "basicDetails.eventSize.ll": { $lte: maxCapacity } });
    }
    // merge with existing matchStage: if other fields exist, $and is implicit;
    // we add $or to ensure either capacity shape matches.
    matchStage.$or = (matchStage.$or || []).concat(capacityOr);
  }

  // ---- Genres (map to serviceDetails.musicGenres) ----
  const genreParam = query.genresOfMusic || query.genres;
  if (genreParam) {
    const genres = genreParam.split(",").map((g) => g.trim()).filter(Boolean);
    if (genres.length) matchStage["serviceDetails.musicGenres"] = { $in: genres };
  }

  // ---- Services offered (map to serviceDetails.servicesOffered) ----
  if (query.typesOfServices) {
    const services = query.typesOfServices.split(",").map((s) => s.trim()).filter(Boolean);
    if (services.length) matchStage["serviceDetails.servicesOffered"] = { $in: services };
  }

  // ---- Rating ----
  if (query.rating) {
    const rating = parseInt(query.rating, 10);
    matchStage["rating"] = {};
    if (rating === 0) {
      matchStage["rating"].$lt = 1;
    } else {
      matchStage["rating"].$gte = rating;
    }
  }

  // ---- Pagination setup ----
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  // ---- Build pipeline ----
  const pipeline = [{ $match: matchStage }];

  // If location is provided, normalize serviceAreas to an array (handles both
  // an array and a comma-separated string) and compute isMatch.
  if (location) {
    pipeline.push({
      $addFields: {
        _serviceAreasArr: {
          $cond: [
            { $eq: [{ $type: "$basicDetails.serviceAreas" }, "array"] },
            "$basicDetails.serviceAreas",
            {
              $cond: [
                { $eq: [{ $type: "$basicDetails.serviceAreas" }, "string"] },
                {
                  // split comma-separated string and trim spaces
                  $map: {
                    input: { $split: [{ $ifNull: ["$basicDetails.serviceAreas", ""] }, ","] },
                    as: "s",
                    in: { $trim: { input: "$$s" } }
                  }
                },
                []
              ]
            }
          ]
        }
      }
    });

    pipeline.push({
      $addFields: {
        isMatch: {
          $cond: [{ $in: [location, "$_serviceAreasArr"] }, 1, 0]
        }
      }
    });
  }

  // ---- Sorting: merge isMatch priority (if any) with user sort ----
  const sortStage = {};
  switch (query.sort) {
    case "lth":
      sortStage["additionalDetails.priceStarts"] = 1;
      break;
    case "htl":
      sortStage["additionalDetails.priceStarts"] = -1;
      break;
    case "rating":
      sortStage["rating"] = -1;
      break;
    default:
      sortStage["_id"] = -1;
  }

  if (location) {
    // when location provided, prefer isMatch first
    pipeline.push({ $sort: Object.assign({ isMatch: -1 }, sortStage) });
  } else {
    pipeline.push({ $sort: sortStage });
  }

  // ---- Facet (count + data pagination) ----
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          { $addFields: { page: page, totalPages: { $ceil: { $divide: ["$total", limit] } } } }
        ],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page"
      }
    }
  );

  // ---- Execute aggregation ----
  const result = await DjArtist.aggregate(pipeline);

  // Helpful debug (remove in production or gate behind a debug flag)
  console.log("searchDjArtists matchStage:", JSON.stringify(matchStage, null, 2));
  // console.log("searchDjArtists pipeline:", JSON.stringify(pipeline, null, 2));

  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};


const searchProducts = async (req, res, next) => {
  try {
    const { type, start_date, end_date } = req.query;

    console.log(req.query);
    let results;

    if (req.query.location && req.query.location.toLowerCase() === "all") {
      req.query.location = "";
    }

    switch (type) {
      case "all":
        results = await searchAllVendors(req.query);
        break;
      case "venues":
        results = await searchVenues(req.query);
        break;
      case "decorators":
        console.log("decorators", req.query);
        results = await searchDecorators(req.query);
        break;
      case "caterers":
        results = await searchCaterers(req.query);
        break;
      case "pav":
        results = await searchPAV(req.query);
        break;
      case "makeupartists":
        console.log("hit");
        results = await searchMakeupArtists(req.query);
        console.log("hit");
        break;
      case "djartists":
        results = await searchDjArtists(req.query);
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

    const modifiedData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      let available = true;

      if (Array.isArray(item?.schedule) && item.schedule.length > 0) {
        for (let j = 0; j < item.schedule.length; j++) {
          const scheduleItem = item.schedule[j];

          if (!scheduleItem?.start || !scheduleItem?.end) continue;

          const itemStart = new Date(scheduleItem.start);
          const itemEnd = new Date(scheduleItem.end);

          if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) continue;

          if (itemStart < endDate && itemEnd > startDate) {
            available = false;
            break;
          }
        }
      }

      // Create a new object combining old item fields and the new available field
      const newItem = {
        ...(item._doc ? item._doc : item), // if item is a Mongoose document
        available: available,
      };

      modifiedData.push(newItem);
    }

    // for (let i = 0; i < results.data.length; i++) {
    //   console.log("hello", resu[i].available);
    //   console.log(resu[i]);
    // }

    // const idList = data.map(item => item.id);

    // let finalOfflineBookings = await checkBookingsInRange(startDate, endDate, idList);

    res.status(200).json({
      message: "Search results fetched successfully.",
      size: modifiedData.length,
      totalResults,
      totalPages,
      currentPage,
      results: modifiedData,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Error fetching the results.",
    });
  }
};

export default searchProducts;
