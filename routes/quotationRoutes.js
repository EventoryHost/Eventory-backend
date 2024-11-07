import express from 'express';
import Quotation from '../models/quotation.js';

const router = express.Router();

// Create a new quotation
router.post('/', async (req, res) => {
  try {
    const { 
      quotation_type, 
      full_name, 
      email_address, 
      mobile_number, 
      location, 
      event_type, 
      date, 
      time, 
      budget, 
      number_of_guests, 
      requirements, 
      vendor_id, 
      vendor_type, 
      status = "Pending" // Default to "Pending" if no status provided
    } = req.body;

    // Create and save a new quotation
    const newQuotation = new Quotation({
      quotation_type,
      full_name,
      email_address,
      mobile_number,
      location,
      event_type,
      date,
      time,
      budget,
      number_of_guests,
      requirements,
      vendor_id,
      vendor_type,
      status
    });

    const savedQuotation = await newQuotation.save();
    res.status(201).json({
      message: 'Quotation created successfully!',
      data: savedQuotation,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating quotation',
      error: error.message,
    });
  }
});

// Get quotations by vendor ID and status (optional)
router.get('/', async (req, res) => {
  try {
    const { vendor_id, status } = req.query;

    if (!vendor_id) {
      return res.status(400).json({
        message: 'vendor_id is required',
      });
    }

    // Build the query based on provided filters
    const query = { vendor_id };
    if (status) query.status = status;

    const quotations = await Quotation.find(query);

    if (quotations.length === 0) {
      return res.status(404).json({
        message: `No quotations found for vendor_id: ${vendor_id} with status: ${status || "any"}`,
      });
    }

    res.status(200).json({
      message: 'Quotations retrieved successfully!',
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving quotations',
      error: error.message,
    });
  }
});

export default router;
