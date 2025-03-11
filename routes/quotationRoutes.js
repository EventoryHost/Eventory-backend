import express from "express";
import { Quotation } from "../models/quotation.js";
import { Customer } from "../models/customer.js";
import { getQuotations } from "../controllers/quotationController.js";

const router = express.Router();

// Create a new quotation
router.post("/", async (req, res) => {
  try {

    const parsedBudget = Number(req.body.budget);
    const parsedNumberOfGuest = Number(req.body.number_of_guest);

    // Validate budget and number_of_guest
    if (isNaN(parsedBudget) || isNaN(parsedNumberOfGuest)) {
      return res.status(400).json({ error: "Budget and Number of Guests must be valid numbers." });
    }
    const newQuotation = new Quotation({
      // Meta Data
      user_id: req.body.user_id,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,

      // Data
      user_name: req.body.user_name,
      email: req.body.email,
      mobile: req.body.mobile,
      event: req.body.event,
      location: req.body.location,
      start_date: new Date(req.body.start_date),
      end_date: new Date(req.body.end_date),

      time: req.body.time,
      budget: parsedBudget,
      number_of_guest: parsedNumberOfGuest,
      requirements: req.body.requirements,
      event_type: req.body.event_type,
    });

    const customer = await Customer.findOne({ id: req.body.user_id });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const savedQuotation = await newQuotation.save();

    if (!customer.bookings) {
      customer.bookings = [];
    }

    if (
      customer.bookings.find(
        (booking) => booking.serviceId === req.body.service_id,
      )
    ) {
      return res.status(400).json({
        message: "Quotation already created for this service",
      });
    }

    customer.bookings.push({
      serviceId: req.body.service_id,
      bookingId: savedQuotation._id,
    });

    await customer.save();

    res.status(201).json({
      message: "Quotation created successfully!",
      data: savedQuotation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
});

// Get quotations by vendor_id or user_id
router.get("/", async (req, res) => {
  try {
    const { vendor_id, user_id } = req.query;
    // console.log(vendor_id, user_id);

    if (!user_id) {
      return res.status(400).json({
        message: "Either vendor_id or user_id is required",
      });
    }

    // Construct query dynamically
    const query = {};
    // if (vendor_id) query.vendor_id = vendor_id;
    if (user_id) query.user_id = user_id;
     console.log(query);
    const quotations = await Quotation.find(query);
    
    if (quotations.length === 0) {
      return res.status(404).json({
        message: `No quotations found for ${vendor_id ? "vendor_id: " + vendor_id : "user_id: " + user_id}`,
      });
    }

    res.status(200).json({
      message: "Quotations retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotations",
      error: error.message,
    });
  }
});

router.patch("/", async (req, res) => {
  try {
    await Quotation.updateOne(
      { id: req.body.id },
      { $set: { status: req.body.status } },
    );
    res.status(200).json({
      message: "Quotation updated successfully!",
      data: req.body.status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating quotation",
      error: error.message,
    });
  }
});


router.route("/myquotations").get(getQuotations);

export default router;
