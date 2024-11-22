// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models/users.js";
const router = express.Router();

// Get vendor details by vendor_id
router.get('/:vendor_id', async (req, res) => {
  const { vendor_id } = req.params;

  try {
    // Find vendor by custom 'id' field
    const vendor = await Vendor.findOne({ id: vendor_id });

    // If vendor not found, return 404
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Return the vendor's details
    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
