import { Quotation } from "../models/quotation.js";
import APIFeatures from "../utils/APIFeatures.js";

const getQuotations = async (req, res, next) => {
   try {
      const { minBudget, maxBudget, start_date, end_date, minCapacity, maxCapacity, status, user_id, limit, page } = req.query;
      console.log("q", req.query);

      const filter = {};

      if (minBudget && maxBudget) {
         filter.budget = { $gte: parseInt(minBudget, 10), $lte: parseInt(maxBudget, 10) };
      }

      //Pass correct format from frontend
      // if (start_date && end_date) {
      //    filter.start_date = { $gte: new Date(start_date) };
      //    filter.end_date = { $lte: new Date(end_date) };
      // }

      if (minCapacity && maxCapacity) {
         filter.number_of_guest = { $gte: parseInt(minCapacity, 10), $lte: parseInt(maxCapacity, 10) };
      }

      if (status) {
         filter.status = status; // Filter by status
      }

      if (user_id) {
         filter.user_id = user_id; // Filter by user_id
      }

      const totalDocuments = await Quotation.countDocuments(filter);

      console.log("filter", filter);

      const features = new APIFeatures(Quotation.find(filter), req.query)
         .sort()
         .limitFields()
         .paginate();

      const quotations = await features.query;

      const limitValue = Number(req.query.limit) || 10;
      const totalPages = Math.ceil(totalDocuments / limitValue);

      // console.log("api", quotations);

      res.status(200).json({
         status: "success",
         results: quotations.length,
         totalDocuments,
         totalPages,
         currentPage: Number(req.query.page) || 1,
         data: quotations,
      });
   } catch (err) {
      res.status(500).json({
         status: "fail",
         message: err.message,
      });
   }
};

export { getQuotations };