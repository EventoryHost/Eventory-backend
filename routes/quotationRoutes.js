import express from "express";
import quotation from "../models/quotation.js";

const router = express.Router();

// Create a new quotation
router.post("/", async (req, res) => {
  try {
    const newQuotation = new quotation({
      // Meta Data
      user_id: req.body.user_id,
      vendor_id: req.body.vendor_id,
      service_id: req.body.service_id,

      // Data
      user_name: req.body.user_name,
      email: req.body.email,
      mobile: req.body.mobile,
      event: req.body.event_name,
      location: req.body.location,
      date: req.body.date,
      time: req.body.time,
      budget: req.body.budget,
      number_of_guest: req.body.number_of_guest,
      requirements: req.body.requirements,
    });

    const savedQuotation = await newQuotation.save();
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

    const quotations = await quotation.find({ vendor_id });

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
