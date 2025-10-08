import Quotations  from "../models2/quotations.js";
import APIFeatures from "../utils/apiFeatures.js";

const getQuotations = async (req, res, next) => {
  try {
    const {
      start_date,
      end_date,
      minCapacity,
      maxCapacity,
      status,
      customer_id,
      limit,
      page,
    } = req.query;

    const filter = {};

    // New guest count field: guest_count
    if (minCapacity && maxCapacity) {
      filter.guest_count = {
        $gte: parseInt(minCapacity, 10),
        $lte: parseInt(maxCapacity, 10),
      };
    }

    // New date fields: event_start and event_end
    if (start_date && end_date) {
      filter.event_start = { $gte: new Date(start_date) };
      filter.event_end = { $lte: new Date(end_date) };
    }

    if (status) {
      filter.quote_status  = status; // Filter by status
    }

    if (customer_id) {
      filter.customer_id  = customer_id; // Filter by user_id
    }
    console.log("Ak", filter);

    const totalDocuments = await Quotations.countDocuments(filter);

    const features = new APIFeatures(Quotations.find(filter), req.query)
      .sort()
      .limitFields()
      .paginate();

    const quotations = await features.query;

    const limitValue = Number(req.query.limit) || 10;
    const totalPages = Math.ceil(totalDocuments / limitValue);

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
