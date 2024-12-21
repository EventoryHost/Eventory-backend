import express from "express";
import venueQuotation from "../models/venueQuotation.js";
import { Customer } from "../models/customer.js";

const router = express.Router();

// Create a new quotation
router.post("/addQuotation", async (req, res) => {
  try {
    // Use `await` to resolve the promise
    const user = await Customer.findOne({ id: req.body.user_id });
    if (!user) {
      return res.status(404).json({
        message: `User with id: ${req.body.user_id} not found`,
      });
    }

    const newQuotation = new venueQuotation({
      event_name: req.body.event_name,
      user_id: req.body.user_id,
      full_name: req.body.full_name,
      number_of_guest: req.body.number_of_guest,
      email: req.body.email,
      mobile: req.body.mobile,
      event_type: req.body.event_type,
      time: req.body.time,
      date: req.body.date,
      budget: req.body.budget,
      requirements: req.body.requirements,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,
    });

    const savedQuotation = await newQuotation.save();

    const booking = {
      serviceId: req.body.service_id,
      bookingId: savedQuotation._id,
    };

    // Ensure `user.bookings` is properly defined before pushing
    if (!user.bookings) {
      user.bookings = [];
    }
    user.bookings.push(booking);

    await user.save();

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

// Get quotations by vendor id
router.get("/", async (req, res) => {
  try {
    const { vendor_id } = req.query;

    if (!vendor_id) {
      return res.status(400).json({
        message: "vendor_id is required",
      });
    }

    const quotations = await venueQuotation.find({ vendor_id });

    if (quotations.length === 0) {
      return res.status(404).json({
        message: `No quotations found for vendor_id: ${vendor_id}`,
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

export default router;
