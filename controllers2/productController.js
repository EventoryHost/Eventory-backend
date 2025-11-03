import mongoose from "mongoose";
import VenueProvider from "../models2/venueProvider.js";
import { Decorator } from "../models2/decorator.js";
import { Caterer } from "../models2/caterer.js";
import Photographer from "../models2/photographerVideographer.js";
import APIFeatures from "../utils/apiFeatures.js";
import MakeupArtist from "../models2/makeupArtist.js";
import { pincodeMap } from "../constants/pincodes_map.js";
import DjArtist from "../models2/djArtist.js";

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


  // Price Range
  if (query.min_price || query.max_price) {
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price) {
      matchStage["additional_details.prices_starts_from"].$gte = parseInt(
        query.min_price,
        10
      );
    }
    if (query.max_price) {
      matchStage["additional_details.prices_starts_from"].$lte = parseInt(
        query.max_price,
        10
      );
    }
  }

  // Guest Capacity
  const minCapacity = query.min_capacity
    ? parseInt(query.min_capacity, 10)
    : null;
  const maxCapacity = query.max_capacity
    ? parseInt(query.max_capacity, 10)
    : null;
  if (minCapacity !== null && maxCapacity !== null) {
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
  }

  // Venue Types
  if (query.venue_types_available) {
    const types = query.venue_types_available.split(",").map((v) => v.trim());
    matchStage["feature_details.venue_types_available"] = { $in: types };
  }

  if (query.in_house_catering !== undefined) {
    matchStage["feature_details.in_house_catering"] = String(query.in_house_catering) === "true";
  }
  if (query.in_house_decoration !== undefined) {
    matchStage["feature_details.in_house_decoration"] = String(query.in_house_decoration) === "true";
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Add location relevance if location is provided
  if (query.location) {
    const pincodes = await getPincodesList(query.location) || [];
    pipeline.unshift({ $match: { service_areas: { $in: pincodes } } });
    pipeline.push(
      { $addFields: { isMatch: { $cond: { if: { $in: [query.location, { $ifNull: ["$service_areas", []] }] }, then: 1, else: 0 } } } },
      { $sort: { isMatch: -1 } }
    );
  }

  // Join with the 'reviews' collection using $lookup
  pipeline.push({
    $lookup: {
      from: "reviews", // The name of the collection in your database
      localField: "service_id", // The field from the VenueProvider collection
      foreignField: "service_id", // The field from the Reviews collection
      as: "reviews",
    },
  });

  // Calculate the average rating for each vendor
  pipeline.push({
    $addFields: {
      average_rating: {
        $avg: "$reviews.rating",
      },
    },
  });

  // Filter by rating if the query parameter is provided
  if (query.rating != null && query.rating !== "") {
    const rating = parseInt(query.rating, 10);
    if (!Number.isNaN(rating)) {
      if (rating === 0) {
        pipeline.push({
          $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] }
        });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: rating } } });
      }
    }
  }

  if (query.sort === "lth") pipeline.push({ $sort: { "additional_details.prices_starts_from": 1 } });
  else if (query.sort === "htl") pipeline.push({ $sort: { "additional_details.prices_starts_from": -1 } });
  else if (query.sort === "rating") pipeline.push({ $sort: { average_rating: -1, _id: -1 } });
  else pipeline.push({ $sort: { _id: -1 } });

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
                  $divide: ["$total", limit],
                },
              },
            },
          },
        ],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await VenueProvider.aggregate(pipeline);
  return (
    result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page }
  );
};

const searchDecorators = async (query) => {
  const matchStage = {};

  if (query.location) {
    const pincodes = await getPincodesList(query.location) || [];
    // narrow to service_areas by pincodes
    if (pincodes.length) matchStage["service_areas"] = { $in: pincodes };
  }

  // Event type
  if (query.event_types_decorated && query.event_types_decorated !== "All") {
    // Corrected path to match schema: basic_details.event_types_decorated
    matchStage["basic_details.event_types_decorated"] = {
      $in: [query.event_types_decorated],
    };
  }

  // Price range
  if (query.min_price || query.max_price) {
    // Corrected path: additional_details.prices_starts_from
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price) {
      matchStage["additional_details.prices_starts_from"].$gte = parseInt(
        query.min_price,
        10
      );
    }
    if (query.max_price) {
      matchStage["additional_details.prices_starts_from"].$lte = parseInt(
        query.max_price,
        10
      );
    }
  }

  // Themes
  if (query.themes_offered) {
    // Corrected path: theme_details.themes_offered
    const themeList = query.themes_offered
      .split(",")
      .map((theme) => theme.trim());
    matchStage["theme_details.themes_offered"] = {
      $in: themeList,
    };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  // The pipeline now starts with the initial match stage
  const pipeline = [
    {
      $match: matchStage,
    },
  ];

  // Add location relevance if location is provided
  if (query.location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                // Corrected path: service_areas is a top-level array
                $in: [
                  query.location,
                  {
                    $ifNull: ["$service_areas", []],
                  },
                ],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $sort: {
          isMatch: -1,
        },
      }
    );
  }

  // --- START: New logic for Reviews integration ---

  // Join with the 'reviews' collection using $lookup
  pipeline.push({
    $lookup: {
      from: "reviews", // The name of the collection in your database
      localField: "service_id", // The field from the Decorator collection
      foreignField: "service_id", // The field from the Reviews collection
      as: "reviews",
    },
  });

  // Calculate the average rating for each vendor
  pipeline.push({
    $addFields: {
      average_rating: {
        $avg: "$reviews.rating",
      },
    },
  });

  // Filter by rating if the query parameter is provided
  if (query.rating != null && query.rating !== "") {
    const rating = parseInt(query.rating, 10);
    if (!Number.isNaN(rating)) {
      if (rating === 0) {
        pipeline.push({
          $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] }
        });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: rating } } });
      }
    }
  }

  if (query.sort === "lth") pipeline.push({ $sort: { "additional_details.prices_starts_from": 1 } });
  else if (query.sort === "htl") pipeline.push({ $sort: { "additional_details.prices_starts_from": -1 } });
  else if (query.sort === "rating") pipeline.push({ $sort: { average_rating: -1, _id: -1 } });
  else pipeline.push({ $sort: { _id: -1 } });

  // --- END: New logic for Reviews integration ---

  // Pagination with metadata
  pipeline.push(
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit],
                },
              },
            },
          },
        ],
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
    {
      $unwind: "$metadata",
    },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await Decorator.aggregate(pipeline);

  return (
    result[0] || {
      data: [],
      totalResults: 0,
      totalPages: 0,
      currentPage: page,
    }
  );
};
const searchCaterers = async (query) => {
  const matchStage = {};

  // Event Type
  if (query.event_types_catered && query.event_types_catered !== "All") {
    // Correct path: event_details.event_types_catered
    matchStage["event_details.event_types_catered"] = {
      $in: [query.event_types_catered],
    };
  }

  // Price range
  if (query.min_price || query.max_price) {
    // Correct path: additional_details.prices_starts_from
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price) {
      matchStage["additional_details.prices_starts_from"].$gte = parseInt(
        query.min_price,
        10
      );
    }
    if (query.max_price) {
      matchStage["additional_details.prices_starts_from"].$lte = parseInt(
        query.max_price,
        10
      );
    }
  }

  // Guest capacity
  const minCapacity = query.min_booking_capacity
    ? parseInt(query.min_booking_capacity, 10)
    : null;
  const maxCapacity = query.max_booking_capacity
    ? parseInt(query.max_booking_capacity, 10)
    : null;
  if (minCapacity !== null && maxCapacity !== null) {
    // Correct paths: basic_details.min_booking_capacity and basic_details.max_booking_capacity
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
  }

  // Cuisine specialities
  if (query.cuisine_specialities) {
    // Correct path: basic_details.cuisine_specialities
    const cuisineList = query.cuisine_specialities
      .split(",")
      .map((item) => item.trim());
    matchStage["basic_details.cuisine_specialities"] = { $in: cuisineList };
  }

  // Veg / Non-Veg
  if (query.veg_or_nonveg) {
    // Correct path: event_details.veg_or_nonveg
    matchStage["event_details.veg_or_nonveg"] =
      query.veg_or_nonveg.toUpperCase();
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: matchStage,
    },
  ];
  if (query.location) {
    const pincodes = await getPincodesList(query.location) || [];
    // narrow to service_areas by pincodes
    if (pincodes.length) matchStage["service_areas"] = { $in: pincodes };
  }


  // Add location-based sorting if location is provided
  if (query.location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                $in: [query.location, { $ifNull: ["$service_areas", []] }],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $sort: {
          isMatch: -1,
        },
      }
    );
  }
  if (query.sort === "lth") pipeline.push({ $sort: { "additional_details.prices_starts_from": 1 } });
  else if (query.sort === "htl") pipeline.push({ $sort: { "additional_details.prices_starts_from": -1 } });
  else if (query.sort === "rating") pipeline.push({ $sort: { average_rating: -1, _id: -1 } });
  else pipeline.push({ $sort: { _id: -1 } });

  // --- START: New logic for Reviews integration ---

  // Join with the 'reviews' collection using $lookup
  pipeline.push({
    $lookup: {
      from: "reviews", // The name of the collection in your database
      localField: "service_id", // The field from the Caterer collection
      foreignField: "service_id", // The field from the Reviews collection
      as: "reviews",
    },
  });

  // Calculate the average rating for each caterer
  pipeline.push({
    $addFields: {
      average_rating: {
        $avg: "$reviews.rating",
      },
    },
  });

  // Filter by rating if the query parameter is provided
  if (query.rating != null && query.rating !== "") {
    const rating = parseInt(query.rating, 10);
    if (!Number.isNaN(rating)) {
      if (rating === 0) {
        pipeline.push({
          $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] }
        });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: rating } } });
      }
    }
  }

  // --- END: New logic for Reviews integration ---

  // Continue with pagination
  pipeline.push(
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit],
                },
              },
            },
          },
        ],
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
    {
      $unwind: "$metadata",
    },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await Caterer.aggregate(pipeline);

  return (
    result[0] || {
      data: [],
      totalResults: 0,
      totalPages: 0,
      currentPage: page,
    }
  );
};

const searchMakeupArtists = async (query) => {
  const matchStage = {};

  if (query.location) {
    const pincodes = await getPincodesList(query.location) || [];
    // narrow to service_areas by pincodes
    if (pincodes.length) matchStage["service_areas"] = { $in: pincodes };
  }

  // Type of Event
  if (query.event_types_makeup && query.event_types_makeup !== "All") {
    // Correct path: basic_details.event_types_makeup
    matchStage["basic_details.event_types_makeup"] = {
      $in: [query.event_types_makeup],
    };
  }

  // Price Range
  if (query.min_price || query.max_price) {
    // Correct path: additional_details.prices_starts_from
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price)
      matchStage["additional_details.prices_starts_from"].$gte = parseInt(
        query.min_price,
        10
      );
    if (query.max_price)
      matchStage["additional_details.prices_starts_from"].$lte = parseInt(
        query.max_price,
        10
      );
  }

  // Event Size / Capacity
  const minCapacity = query.min_booking_capacity
    ? parseInt(query.min_booking_capacity, 10)
    : null;
  const maxCapacity = query.max_booking_capacity
    ? parseInt(query.max_booking_capacity, 10)
    : null;
  if (minCapacity !== null && maxCapacity !== null) {
    // Correct paths: basic_details.min_booking_capacity and basic_details.max_booking_capacity
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
  }

  // Types of Makeup Artists
  if (query.types_of_makeup_artists) {
    const types = query.types_of_makeup_artists.split(",").map((t) => t.trim());
    // Correct path: basic_details.types_of_makeup_artists_available
    matchStage["basic_details.types_of_makeup_artists_available"] = {
      $in: types,
    };
  }

  if (query.is_onsite_makeup_available !== undefined) {
    matchStage["service_details.is_onsite_makeup_available"] = String(query.is_onsite_makeup_available) === "true";
  }

  // Service Types
  if (query.service_types) {
    const services = query.service_types.split(",").map((t) => t.trim());
    // Correct path: service_details.service_types
    matchStage["service_details.service_types"] = { $in: services };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: matchStage,
    },
  ];

  // Location prioritization
  if (query.location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: {
                // Correct path: service_areas
                $in: [query.location, { $ifNull: ["$service_areas", []] }],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $sort: {
          isMatch: -1,
        },
      }
    );
  }

  if (query.sort === "lth") pipeline.push({ $sort: { "additional_details.prices_starts_from": 1 } });
  else if (query.sort === "htl") pipeline.push({ $sort: { "additional_details.prices_starts_from": -1 } });
  else if (query.sort === "rating") pipeline.push({ $sort: { average_rating: -1, _id: -1 } });
  else pipeline.push({ $sort: { _id: -1 } });

  // --- START: New logic for Reviews integration ---

  // Join with the 'reviews' collection using $lookup
  pipeline.push({
    $lookup: {
      from: "reviews", // The name of the collection
      localField: "service_id", // Field from the MakeupArtist collection
      foreignField: "service_id", // Field from the Reviews collection
      as: "reviews",
    },
  });

  // Calculate the average rating for each makeup artist
  pipeline.push({
    $addFields: {
      average_rating: {
        $avg: "$reviews.rating",
      },
    },
  });

  // Filter by rating if the query parameter is provided
  if (query.rating != null && query.rating !== "") {
    const rating = parseInt(query.rating, 10);
    if (!Number.isNaN(rating)) {
      if (rating === 0) {
        pipeline.push({
          $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] }
        });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: rating } } });
      }
    }
  }


  // --- END: New logic for Reviews integration ---

  // Pagination and metadata
  pipeline.push(
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
          {
            $addFields: {
              page: page,
              totalPages: {
                $ceil: {
                  $divide: ["$total", limit],
                },
              },
            },
          },
        ],
        data: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
    {
      $unwind: "$metadata",
    },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await MakeupArtist.aggregate(pipeline);

  return (
    result[0] || {
      data: [],
      totalResults: 0,
      totalPages: 0,
      currentPage: page,
    }
  );
};

const searchPAV = async (query) => {
  const matchStage = {};

  // Event type
  if (query.event_types_captured && query.event_types_captured !== "All") {
    // Schema path: basic_details.event_types_captured
    matchStage["basic_details.event_types_captured"] = {
      $in: [query.event_types_captured],
    };
  }

  // Price range
  if (query.min_price || query.max_price) {
    // Schema path: additional_details.prices_starts_from
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price) {
      matchStage["additional_details.prices_starts_from"].$gte = parseInt(
        query.min_price,
        10
      );
    }
    if (query.max_price) {
      matchStage["additional_details.prices_starts_from"].$lte = parseInt(
        query.max_price,
        10
      );
    }
  }

  // Event size / capacity
  const minCapacity = query.min_booking_capacity
    ? parseInt(query.min_booking_capacity, 10)
    : null;
  const maxCapacity = query.max_booking_capacity
    ? parseInt(query.max_booking_capacity, 10)
    : null;

  if (minCapacity !== null && maxCapacity !== null) {
    // Schema paths: basic_details.min_booking_capacity/max_booking_capacity
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (minCapacity !== null) {
    matchStage["basic_details.max_booking_capacity"] = { $gte: minCapacity };
  } else if (maxCapacity !== null) {
    matchStage["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
  }

  // Service type: photography|videography|both
  if (query.type_of_service) {
    // Schema path: service_details.type_of_service
    matchStage["service_details.type_of_service"] = String(
      query.type_of_service
    ).toLowerCase();
  }

  // Styles
  if (query.types_of_styles_offered) {
    const styles = query.types_of_styles_offered
      .split(",")
      .map((s) => s.trim());
    // Schema path: service_details.types_of_styles_offered
    matchStage["service_details.types_of_styles_offered"] = { $in: styles };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Location prioritization (consistent with other type searches)
  if (query.location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: { $in: [query.location, { $ifNull: ["$service_areas", []] }] },
              then: 1,
              else: 0,
            },
          },
        },
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Reviews lookup and average rating
  pipeline.push({
    $lookup: {
      from: "reviews",
      localField: "service_id",
      foreignField: "service_id",
      as: "reviews",
    },
  });

  pipeline.push({
    $addFields: {
      average_rating: { $avg: "$reviews.rating" },
    },
  });

  // Rating filter (including 0 => no reviews or < 1 average)
  if (query.rating != null && query.rating !== "") {
    const rating = parseInt(query.rating, 10);
    if (!Number.isNaN(rating)) {
      if (rating === 0) {
        pipeline.push({
          $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] }
        });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: rating } } });
      }
    }
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
              totalPages: { $ceil: { $divide: ["$total", limit] } },
            },
          },
        ],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await Photographer.aggregate(pipeline);

  return (
    result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page }
  );
};

const searchAllVendors = async (query) => {
  try {
    const filters = {};

    // Location filter
    if (query.location) {
      const cityName = query.location;
      // Use getPincodesList to get an array of pincodes
      const pincodes = await getPincodesList(cityName);

      // Use the $in operator with the array of pincodes
      filters["service_areas"] = { $in: pincodes };
    }

    // Handle price range filtering
    if (query.min_price || query.max_price) {
      filters["additional_details.prices_starts_from"] = {};
      if (query.min_price)
        filters["additional_details.prices_starts_from"].$gte = parseInt(
          query.min_price,
          10
        );
      if (query.max_price)
        filters["additional_details.prices_starts_from"].$lte = parseInt(
          query.max_price,
          10
        );
    }

    // Handle capacity filtering
    if (query.min_capacity || query.max_capacity) {
      const minCapacity = query.min_capacity ?
        parseInt(query.min_capacity, 10) :
        null;
      const maxCapacity = query.max_capacity ?
        parseInt(query.max_capacity, 10) :
        null;

      if (minCapacity !== null && maxCapacity !== null) {
        filters["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
        filters["basic_details.max_booking_capacity"] = { $gte: minCapacity };
      } else if (minCapacity !== null) {
        filters["basic_details.max_booking_capacity"] = { $gte: minCapacity };
      } else if (maxCapacity !== null) {
        filters["basic_details.min_booking_capacity"] = { $lte: maxCapacity };
      }
    }

    // Handle event types filtering
    if (query.event_types) {
      query.event_types = query.event_types.split(",");
    }

    // Sorting logic
    let sortStage = {};
    if (query.sort === "lth") {
      sortStage = { "additional_details.prices_starts_from": 1 };
    } else if (query.sort === "htl") {
      sortStage = { "additional_details.prices_starts_from": -1 };
    } else {
      sortStage = { _id: -1 };
    }

    // Pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 9;
    const skip = (page - 1) * limit;

    const aggregatePipeline = (modelType) => {
      const pipeline = [];

      pipeline.push({ $match: filters });

      if (query.event_types) {
        let eventField = "";
        switch (modelType) {
          case "caterer": eventField = "event_details.event_types_catered"; break;
          case "decorator": eventField = "basic_details.event_types_decorated"; break;
          case "photographer": eventField = "basic_details.event_types_captured"; break;
          case "makeup_artist": eventField = "basic_details.event_types_makeup"; break;
          case "venue_provider": eventField = "basic_details.event_types_venue"; break; // do NOT filter venues by event type
        }
        if (eventField) {
          pipeline.push({ $match: { [eventField]: { $in: query.event_types } } });
        }
      }


      pipeline.push(
        {
          $lookup: {
            from: "reviews",
            localField: "service_id",
            foreignField: "service_id",
            as: "reviews",
          },
        },
        {
          $addFields: {
            average_rating: { $avg: "$reviews.rating" },
          },
        }
      );

      // Rating filter (opt-in)
      if (query.rating != null && query.rating !== "") {
        const rating = parseInt(query.rating, 10);
        if (!Number.isNaN(rating)) {
          if (rating === 0) {
            pipeline.push({
              $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] },
            });
          } else {
            pipeline.push({ $match: { average_rating: { $gte: rating } } });
          }
        }
      }

      return pipeline;
    };


    // Create separate pipelines for each vendor type
    const venuePipeline = aggregatePipeline("venue_provider");
    const catererPipeline = aggregatePipeline("caterer");
    const decoratorPipeline = aggregatePipeline("decorator");
    const photographerPipeline = aggregatePipeline("photographer");
    const makeupArtistPipeline = aggregatePipeline("makeup_artist");

    // Execute all pipelines and combine
    const [venues, caterers, decorators, photographers, makeupArtists] = await Promise.all([
      VenueProvider.aggregate(venuePipeline),
      Caterer.aggregate(catererPipeline),
      Decorator.aggregate(decoratorPipeline),
      Photographer.aggregate(photographerPipeline),
      MakeupArtist.aggregate(makeupArtistPipeline)
    ]);

    // Manually merge results and handle final sorting and pagination
    let combinedResults = [...venues, ...caterers, ...decorators, ...photographers, ...makeupArtists];

    // Apply sorting
    if (sortStage["additional_details.prices_starts_from"]) {
      combinedResults.sort((a, b) => {
        const aPrice = a.additional_details?.prices_starts_from || 0;
        const bPrice = b.additional_details?.prices_starts_from || 0;
        if (sortStage["additional_details.prices_starts_from"] === 1) {
          return aPrice - bPrice;
        } else {
          return bPrice - aPrice;
        }
      });
    } else {
      combinedResults.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
    }

    const totalResults = combinedResults.length;
    const paginatedResults = combinedResults.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalResults / limit);

    return {
      data: paginatedResults,
      totalResults,
      totalPages,
      currentPage: page,
    };

  } catch (error) {
    console.error("Error fetching all vendors:", error);
    throw new Error("Error fetching all vendors");
  }
};

const searchDJArtists = async (query) => {
  const matchStage = {};

  // Price
  if (query.min_price || query.max_price) {
    matchStage["additional_details.prices_starts_from"] = {};
    if (query.min_price) matchStage["additional_details.prices_starts_from"].$gte = parseInt(query.min_price, 10);
    if (query.max_price) matchStage["additional_details.prices_starts_from"].$lte = parseInt(query.max_price, 10);
  }

  // Event type filter
  if (query.type_of_event) {
    const list = String(query.type_of_event).split(",").map(s => s.trim()).filter(Boolean);
    if (list.length) matchStage["service_details.event_types_dj"] = { $in: list };
  }

  // Music genres filter
  if (query.genres_of_music) {
    const list = String(query.genres_of_music).split(",").map(s => s.trim()).filter(Boolean);
    if (list.length) matchStage["service_details.music_genres"] = { $in: list };
  }

  // Services offered filter
  if (query.types_of_services) {
    const list = String(query.types_of_services).split(",").map(s => s.trim()).filter(Boolean);
    if (list.length) matchStage["service_details.services_offered"] = { $in: list };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 9;
  const skip = (page - 1) * limit;

  const pipeline = [{ $match: matchStage }];

  // Location relevance
  if (query.location) {
    pipeline.push(
      {
        $addFields: {
          isMatch: {
            $cond: {
              if: { $in: [query.location, { $ifNull: ["$service_areas", []] }] },
              then: 1,
              else: 0,
            },
          },
        },
      },
      { $sort: { isMatch: -1 } }
    );
  }

  // Reviews lookup + average
  pipeline.push(
    {
      $lookup: {
        from: "reviews",
        localField: "service_id",
        foreignField: "service_id",
        as: "reviews",
      },
    },
    {
      $addFields: {
        average_rating: { $avg: "$reviews.rating" },
      },
    }
  );

  // Rating filter
  if (query.rating != null && query.rating !== "") {
    const r = parseInt(query.rating, 10);
    if (!Number.isNaN(r)) {
      if (r === 0) {
        pipeline.push({ $match: { $or: [{ average_rating: { $lt: 1 } }, { average_rating: null }] } });
      } else {
        pipeline.push({ $match: { average_rating: { $gte: r } } });
      }
    }
  }

  // Sorting (legacy)
  // Expect sort in { lth|htl|rating|whats_new }
  const sortKey = String(query.sort || "whats_new").toLowerCase();
  if (sortKey === "lth") pipeline.push({ $sort: { "additional_details.prices_starts_from": 1 } });
  else if (sortKey === "htl") pipeline.push({ $sort: { "additional_details.prices_starts_from": -1 } });
  else if (sortKey === "rating") pipeline.push({ $sort: { average_rating: -1 } });
  else pipeline.push({ $sort: { dj_artist_created_at: -1 } }); // default newest

  // Pagination with metadata
  pipeline.push(
    {
      $facet: {
        metadata: [
          { $count: "total" },
          { $addFields: { page, totalPages: { $ceil: { $divide: ["$total", limit] } } } },
        ],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        totalResults: "$metadata.total",
        totalPages: "$metadata.totalPages",
        currentPage: "$metadata.page",
      },
    }
  );

  const result = await DjArtist.aggregate(pipeline);
  return result[0] || { data: [], totalResults: 0, totalPages: 0, currentPage: page };
};

export const searchProducts = async (req, res, next) => {
  console.log("--- Starting searchProducts function ---");
  console.log("Received query parameters:", req.query);
  try {
    const { type, start_date, end_date } = req.query;
    let results;

    const queryParams = { ...req.query };
    if (queryParams.location && queryParams.location.toLowerCase() === "all") {
      queryParams.location = "";
      console.log("Location set to empty string for 'all'.");
    }

    console.log("Processing with queryParams:", queryParams);

    const startDate = start_date ? new Date(start_date) : null;
    const endDate = end_date ? new Date(end_date) : null;

    if (
      (startDate && isNaN(startDate.getTime())) ||
      (endDate && isNaN(endDate.getTime()))
    ) {
      console.error("Validation failed: Invalid date format.");
      return res.status(400).json({ message: "Invalid date format." });
    }

    console.log(`Switching on vendor type: ${type}`);
    switch (type) {
      case "all":
        console.log("Calling searchAllVendors.");
        results = await searchAllVendors(queryParams);
        break;
      case "venues":
        console.log("Calling searchVenues.");
        results = await searchVenues(queryParams);
        break;
      case "decorators":
        console.log("Calling searchDecorators.");
        results = await searchDecorators(queryParams);
        break;
      case "caterers":
        console.log("Calling searchCaterers.");
        results = await searchCaterers(queryParams);
        break;
      case "pav":
        console.log("Calling searchPAV.");
        results = await searchPAV(queryParams);
        break;
      case "makeupartists":
        console.log("Calling searchMakeupArtists.");
        results = await searchMakeupArtists(queryParams);
        break;
      case "djartists":
        console.log("Calling searchDJArtists.");
        results = await searchDJArtists(queryParams);
        break;

      default:
        console.error("Validation failed: Invalid product type.");
        return res.status(400).json({ message: "Invalid Product type." });
    }
    console.log("Successfully retrieved results from search function.");
    console.log("Number of initial results:", results?.data?.length);

    const { totalResults, totalPages, currentPage } = results;
    const data = results.data || [];

    const modifiedData = data.map((item, index) => {
      let isAvailable = true;
      // You should check if `item` has a `schedule` property before accessing it.
      if (
        item.schedule &&
        Array.isArray(item.schedule) &&
        (startDate || endDate)
      ) {
        console.log(
          `Checking availability for item #${index} with a schedule.`
        );
        for (const scheduleItem of item.schedule) {
          if (!scheduleItem.start || !scheduleItem.end) continue;

          const itemStart = new Date(scheduleItem.start);
          const itemEnd = new Date(scheduleItem.end);

          if (isNaN(itemStart.getTime()) || isNaN(itemEnd.getTime())) {
            console.error(`Invalid schedule date for item #${index}.`);
            continue;
          }

          if (itemStart < endDate && itemEnd > startDate) {
            isAvailable = false;
            console.log(`Conflict found for item #${index}. Not available.`);
            break;
          }
        }
      }

      return {
        ...item,
        available: isAvailable,
      };
    });
    console.log(
      "Finished processing availability. Final size:",
      modifiedData.length
    );

    res.status(200).json({
      message: "Search results fetched successfully.",
      size: modifiedData.length,
      totalResults,
      totalPages,
      currentPage,
      results: modifiedData,
    });
    console.log("--- searchProducts function finished successfully. ---");
  } catch (e) {
    console.error("An unhandled error occurred in searchProducts:", e);
    res.status(500).json({
      message: "Error fetching the results.",
    });
  }
};

export default searchProducts;
