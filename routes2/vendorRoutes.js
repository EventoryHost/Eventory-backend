// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models2/vendor.js";
import vendorNotification from "../models2/vendorNotifications.js";

const router = express.Router();
/**
 * @swagger
 * /api/vendors/all:
 *   get:
 *     summary: Get all vendors with name, email, mobile, address, serviceIds and category
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
    // Fetch only needed fields from the new Vendor schema
    const vendors = await Vendor.find(
      {},
      "vendor_id vendor_mobile email_address profile_picture services service_types highest_discount_ever_applied vendor_created_at vendor_updated_at"
    ).lean();

    // Filter: vendors that have at least one service_type or service
    const filteredVendors = vendors.filter((vendor) => {
      const hasServiceTypes =
        Array.isArray(vendor.service_types) && vendor.service_types.length > 0;
      const hasServices =
        Array.isArray(vendor.services) && vendor.services.length > 0;
      return hasServiceTypes || hasServices;
    });

    // Transform data to match frontend-friendly format
    const transformedVendors = filteredVendors.map((vendor) => ({
      vendor_id: vendor.vendor_id,
      mobile: vendor.vendor_mobile || "N/A",
      email: vendor.email_address || "N/A",
      profile_picture: vendor.profile_picture || null,
      services: vendor.services || [],
      service_types: vendor.service_types.map((s) => ({
        name: s.service_name,
        id: s.service_id || "N/A",
        status: s.service_status || "Inactive",
      })),
      highest_discount_ever_applied: vendor.highest_discount_ever_applied || 0,
      vendor_created_at: vendor.vendor_created_at,
      vendor_updated_at: vendor.vendor_updated_at,
    }));

    res.status(200).json({
      success: true,
      total: transformedVendors.length,
      data: transformedVendors,
    });
  } catch (error) {
    console.error("Error fetching all vendors:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendors",
      error: error.message,
    });
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
    const vendor = await Vendor.findOne({ vendor_id });

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
router.get("/:vendor_id/vendorNotification", async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const notifications = await vendorNotification
      .find({ vendor_id })
      .sort({ updated_at: -1 })
      .lean();

    const unreadCount = await vendorNotification.countDocuments({
      vendor_id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching vendor notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
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
router.put("/:vendor_id/vendorNotification/mark-read", async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const result = await vendorNotification.updateMany(
      { vendor_id, read: false },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as read successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
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
router.patch(
  "/:vendor_id/vendorNotification/mark-as-read",
  async (req, res) => {
    try {
      const { vendor_id } = req.params;

      await vendorNotification.updateMany(
        { vendor_id, read: false },
        { $set: { read: true, updated_at: new Date().toISOString() } }
      );

      res.status(200).json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      res.status(500).json({
        success: false,
        message: "Failed to mark notifications as read",
        error: err.message,
      });
    }
  }
);

export default router;
