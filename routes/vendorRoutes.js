// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models/users.js";
import vendorNotification from "../models/vendorNotification.js";

const router = express.Router();

// Get vendor details by vendor_id
router.get("/:vendor_id", async (req, res) => {
  const { vendor_id } = req.params;

  try {
    // Find vendor by custom 'id' field
    const vendor = await Vendor.findOne({ id: vendor_id });

    // If vendor not found, return 404
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Return the vendor's details
    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// In your backend (vendorNotification route)
router.get("/:vendorId/vendorNotification", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const notifications = await vendorNotification.find({
      vendorId,
    }).sort({ timestamp: -1 });

    res.status(200).json({ message: "Notifications fetched", data: notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});


export default router;
