import express from "express";
import venueQuotation from "../models/venueQuotation.js";

const router = express.Router();

// Create a new quotation
router.post("/", async (req, res) => {
  try {
    const newQuotation = new venueQuotation({
      event_name: req.body.event_name,
      number_of_guest: req.body.number_of_guest,
      date: req.body.date,
      time: req.body.time,
      budget: req.body.budget,
      requirements: req.body.requirements,
      user_id: req.body.user_id,
      user_name: req.body.user_name,
      vendor_id: req.body.vendor_id,
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

// Get all quotations
router.get("/all", async (req, res) => {
  try {
    const quotations = await venueQuotation.find(); // Fetch all quotations from the database

    if (quotations.length === 0) {
      return res.status(404).json([]);  // Return an empty array if no quotations are found
    }

    res.status(200).json(quotations); // Return the array of quotations as JSON
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotations", // Send a meaningful error message
      error: error.message,  // Include error details for debugging
    });
  }
});



export default router;
