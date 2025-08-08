// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models/users.js";
import vendorNotification from "../models/vendorNotification.js";

const router = express.Router();
/**
 * @swagger
 * /api/vendors/all:
 *   get:
 *     summary: Get all vendors with name, email, mobile, address, and category
 *     tags:
 *       - Vendors
 *     responses:
 *       200:
 *         description: A list of vendors
 *       500:
 *         description: Server error
 */

router.get("/all", async (req, res) => {
  try {
    const vendors = await Vendor.find(
      {},
      "id name email mobile businessDetails.address businessDetails.category invoices serviceIds"
    ).lean();

    const filteredVendors = vendors.filter(vendor => {

      const hasInvoices = Array.isArray(vendor.invoices) && vendor.invoices.length > 0;
      const hasServices = Array.isArray(vendor.serviceIds) && vendor.serviceIds.length > 0;

      return hasInvoices && hasServices;
    });

    const transformedVendors = filteredVendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || "N/A",
      mobile: vendor.mobile || "N/A",
      address: vendor.businessDetails?.address || "N/A",
      category: vendor.businessDetails?.category || "N/A",
    }));

    res.status(200).json({ success: true, data: transformedVendors });

  } catch (error) {
    console.error("Error fetching all vendors:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/vendors/{vendor_id}:
 *   get:
 *     summary: Get vendor details by vendor ID
 *     tags:
 *       - Vendors
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom vendor ID
 *     responses:
 *       200:
 *         description: Vendor found
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */


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

/**
 * @swagger
 * /api/vendors/{vendorId}/vendorNotification:
 *   get:
 *     summary: Get vendor notifications and unread count
 *     tags:
 *       - Vendors
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications fetched
 *       500:
 *         description: Failed to fetch notifications
 */


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

/**
 * @swagger
 * /api/vendors/{vendorId}/vendorNotification/mark-read:
 *   put:
 *     summary: Mark all unread vendor notifications as read
 *     tags:
 *       - Vendors
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       500:
 *         description: Failed to mark notifications
 */


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

/**
 * @swagger
 * /api/vendors/{vendorId}/vendorNotification/mark-as-read:
 *   patch:
 *     summary: Mark all vendor notifications as read
 *     tags:
 *       - Vendors
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       500:
 *         description: Failed to mark notifications
 */


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
