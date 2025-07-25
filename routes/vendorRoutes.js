// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models/users.js";
import vendorNotification from "../models/vendorNotification.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    // 1. Projection: Select only necessary fields for the directory table
    // Fetch 'id', 'name', 'email', 'mobile', and specific fields from 'businessDetails'.
    // Assuming 'businessDetails' subdocument contains 'address' and 'category'.
    // If 'price' is a general price for the vendor, it should be added to the businessDetails schema.
    // For now, we'll assume a placeholder for 'price' if it's not directly stored.
    const vendors = await Vendor.find(
      {},
      'id name email mobile businessDetails.address businessDetails.category'
    ).lean();

    // 2. Data Transformation: Format the data as expected by the frontend
    const transformedVendors = vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || 'N/A', // Provide default if null
      mobile: vendor.mobile || 'N/A', // Provide default if null
      address: vendor.businessDetails?.address || 'N/A',
      category: vendor.businessDetails?.category || 'N/A',
    }));

    res.status(200).json({ success: true, data: transformedVendors });

  } catch (error) {
    console.error("Error fetching all vendors:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


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

// Get all notifications and count unread
router.get("/:vendorId/vendorNotification", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const notifications = await vendorNotification.find({ vendorId }).sort({ timestamp: -1 });
    const unreadCount = await vendorNotification.countDocuments({ vendorId, read: false });

    res.status(200).json({ 
      message: "Notifications fetched", 
      data: notifications,
      unreadCount 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});

router.put("/:vendorId/vendorNotification/mark-read", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await vendorNotification.updateMany(
      { vendorId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read", modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notifications as read", error: error.message });
  }
});

// PATCH /api/vendors/:vendorId/vendorNotification/mark-as-read
router.patch('/:vendorId/vendorNotification/mark-as-read', async (req, res) => {
  try {
    const { vendorId } = req.params;
    await vendorNotification.updateMany({ vendorId, read: false }, { $set: { read: true } });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notifications", error: err.toString() });
  }
});




export default router;
