import { Venue } from "../models/venue.js";
import { Decorator } from "../models/decoraters.js";
import { Caterer } from "../models/caterer.js";
import Photographer from "../models/photographers.js";
import APIFeatures from "../utils/apiFeatures.js";

const searchVenues = async (query) => {
   const filters = {};

   console.log(query);

   //handle price range
   if (query.minPrice || query.maxPrice) {
      filters['filters.startingPrice'] = {};
      if (query.minPrice) filters['filters.startingPrice'].$gte = parseInt(query.minPrice, 10);
      if (query.maxPrice) filters['filters.startingPrice'].$lte = parseInt(query.maxPrice, 10);
   }

   //handle guest capacity range
   if (query.minCapacity || query.maxCapacity) {
      const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
      const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;

      if (minCapacity !== null && maxCapacity !== null) {
         filters['filters.guestCapacity.ll'] = { $lte: maxCapacity };
         filters['filters.guestCapacity.ul'] = { $gte: minCapacity };
      } else if (minCapacity !== null) {
         filters['filters.guestCapacity.ll'] = { $lte: maxCapacity };
      } else if (maxCapacity !== null) {
         filters['filters.guestCapacity.ul'] = { $gte: minCapacity };
      }
   }

   //handle veneue types
   if (query.venueTypes) {
      query.venueTypes = query.venueTypes ? query.venueTypes.split(',') : [];
      filters['featureDetails.venueTypes'] = { $in: query.venueTypes };
   }

   // console.log(filters);

   let venueQuery = Venue.find(filters);

   const apiFeatures = new APIFeatures(venueQuery, query).sort().limitFields().paginate();

   const venues = await apiFeatures.query;

   return venues;
};

const searchDecorators = async (query) => {
   const filters = {};
   if (query.minPrice || query.maxPrice) {
      filters['filters.priceStartingFrom'] = {};
      if (query.minPrice) filters['filters.startingPrice'] = { $gte: parseInt(query.minPrice, 10) };
      if (query.maxPrice) filters['filters.startingPrice'] = { $lte: parseInt(query.maxPrice, 10) };
      console.log(filters);
   }

   // Handle themes offered
   if (query.themes) {
      query.themes = query.themes ? query.themes.split(',') : [];
      filters['themesOffered.themesOffered'] = { $in: query.themes };
   }

   let decoratorQuery = Decorator.find(filters);

   const apiFeatures = new APIFeatures(decoratorQuery, query).sort().limitFields().paginate();

   const decorators = await apiFeatures.query;

   return decorators;
};

const searchCaterers = async (query) => {
   // console.log("start", query, "End");
   const filters = {};

   // Handle price range
   if (query.minPrice || query.maxPrice) {
      filters['additionalDetails.priceStartingFrom'] = {};
      if (query.minPrice) filters['additionalDetails.priceStartingFrom'].$gte = parseInt(query.minPrice, 10);
      if (query.maxPrice) filters['additionalDetails.priceStartingFrom'].$lte = parseInt(query.maxPrice, 10);
   }

   if (query.rating) {
      filters['rating'] = {};
      filters['rating'].$gte = parseInt(query.minPrice, 10);
   }

   // Handle guest capacity range
   if (query.minCapacity || query.maxCapacity) {
      const minCapacity = query.minCapacity ? parseInt(query.minCapacity, 10) : null;
      const maxCapacity = query.maxCapacity ? parseInt(query.maxCapacity, 10) : null;

      if (minCapacity !== null && maxCapacity !== null) {
         filters['basicDetails.capacity.ll'] = { $lte: maxCapacity };
         filters['basicDetails.capacity.ul'] = { $gte: minCapacity };
      } else if (minCapacity !== null) {
         filters['basicDetails.capacity.ul'] = { $gte: minCapacity };
      } else if (maxCapacity !== null) {
         filters['basicDetails.capacity.ll'] = { $lte: maxCapacity };
      }
   }

   if (query.cuisineSpecialities) {
      const cuisineList = query.cuisineSpecialities.split(',').map(item => item.trim());
      filters['basicDetails.cuisine_specialities'] = { $in: cuisineList };
   }

   if (query.vegOrNonVeg) {
      filters['menuDetails.vegOrNonVeg'] = query.vegOrNonVeg.toLowerCase();
   }

   let catererQuery = Caterer.find(filters);

   console.log("priyanshu", filters, "end");

   const apiFeatures = new APIFeatures(catererQuery, query).sort().limitFields().paginate();

   const caterers = await apiFeatures.query;

   return caterers;
};

const searchPAV = async (query) => {
   const filters = {};

   // Handle price range
   // if (query.minPrice || query.maxPrice) {
   //    filters['filters.price'] = {};
   //    if (query.minPrice) filters['filters.price'].$gte = parseInt(query.minPrice, 10);
   //    if (query.maxPrice) filters['filters.price'].$lte = parseInt(query.maxPrice, 10);
   // }

   // Handle event types filtering
   if (query.eventTypes) {
      const eventList = query.eventTypes.split(',').map(item => item.trim());
      filters['basicDetails.eventTypes'] = { $in: eventList };
   }

   // Handle services and styles filtering
   if (query.services) {
      const services = query.services.toLowerCase();
      if (services === 'photography' || services === 'videography') {
         const stylesField = `${services.charAt(0).toUpperCase() + services.slice(1)}.typesOfStyles`;
         if (query.styles) {
            const stylesList = query.styles.split(',').map(style => style.trim());
            filters[stylesField] = { $in: stylesList };
         }
      } else if (services === 'both') {
         const photoStylesField = 'Photography.typesOfStyles';
         const videoStylesField = 'Videography.typesOfStyles';
         if (query.styles) {
            const stylesList = query.styles.split(',').map(style => style.trim());
            filters.$or = [
               { [photoStylesField]: { $in: stylesList } },
               { [videoStylesField]: { $in: stylesList } }
            ];
         }
      }
   }

   let photographerQuery = Photographer.find(filters);

   const apiFeatures = new APIFeatures(photographerQuery, query).sort().limitFields().paginate();

   const photographers = await apiFeatures.query;

   return photographers;
};

const searchProducts = async (req, res, next) => {
   try {
      const { type } = req.query;
      let results;

      switch (type) {
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

      // console.log("finals: ", results);

      res.status(200).json({
         message: "Search results fetched successfully.",
         size: results.length,
         results
      });
   } catch (e) {
      console.error(e);
      res.status(500).json({
         message: "Error fetching the results."
      });
   }
}

export default searchProducts;
