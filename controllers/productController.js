import { Venue } from "../models/venue.js";
import APIFeatures from "../utils/apiFeatures.js";

const searchVenues = async (query) => {
   const filters = {};

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


const searchProducts = async (req, res, next) => {
   try {
      const { type } = req.query;
      let results;

      switch (type) {
         case "venues":
            results = await searchVenues(req.query);
            break;
         default:
            return res.status(400).json({ message: "Invalid search type." });
      }

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
