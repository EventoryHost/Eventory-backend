// routes/vendorRoutes.js
import express from "express";
import { Vendor } from "../models/users.js";
import Message  from "../models/message.js";
import vendorNotification from "../models/vendorNotification.js";
import {Quotation} from "../models/quotation.js";
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
    // 1. Change the projection to retrieve the entire businessDetails object.
    const vendors = await Vendor.find(
      {},
      "id name email mobile businessDetails invoices serviceIds"
    ).lean();

    const filteredVendors = vendors.filter(vendor => {
      const hasServices = Array.isArray(vendor.serviceIds) && vendor.serviceIds.length > 0;
      return hasServices;
    });

    const transformedVendors = filteredVendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || "N/A",
      mobile: vendor.mobile || "N/A",
      // 2. Now you can access all properties from the fetched object
      businessDetails: {
          address: vendor.businessDetails?.businessAddress || "N/A",
          category: vendor.businessDetails?.category || "N/A",
          teamsize: vendor.businessDetails?.teamsize || "N/A",
          years: vendor.businessDetails?.years || "N/A",
          bookingsPerMonth: vendor.businessDetails?.bookingsPerMonth || "N/A",
      },
      serviceIds: vendor.serviceIds || [],
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

// for single quotation 
// When a message come on a quotation this api gives the unread count of THAT quotation
// first hit it when page gets loaded then after someone has read the message 
router.get("/:chatId/:usertype/read-by", async (req, res) => {
  try {
    const { chatId, usertype } = req.params;

    // Find all messages belonging to this chat
    const messages = await Message.find({ chatId });

    console.log(`Chat ID: ${chatId}, Usertype: ${usertype}, Total Messages: ${messages.length}`);

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No messages found for this chat",
      });
    }

    // Filter unread messages for this usertype
    const unreadMessages = messages.filter(
      msg => !msg.readBy.includes(usertype)
    );

    console.log(`Unread Messages for ${usertype}: ${unreadMessages.length}`);

    return res.json({
      success: true,
      chatId,
      usertype,
      unreadCount: unreadMessages.length,
    });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// for marking the unread count when a usertype has read the unread messages.
router.patch("/:chatId/:usertype/vendorNotification/read-by", async (req, res) => {
  try {
    const { chatId, usertype } = req.params;

    // Update all messages where this usertype is NOT in readBy
    const result = await Message.updateMany(
      { chatId, readBy: { $ne: usertype } }, // condition: usertype not in readBy
      { $push: { readBy: usertype } }        // action: add usertype
    );

    return res.json({
      success: true,
      chatId,
      usertype,
      updatedCount: result.modifiedCount, // number of messages updated
      message: `${result.modifiedCount} messages marked as read for ${usertype}`,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Corrected Backend API to get unread counts for all chats of a vendor
// placed after all your previous routes but before the final `export default router`
router.get("/:vendorId/:usertype/unread-counts", async (req, res) => {
  try {
    const { vendorId, usertype } = req.params;

    // Find all quotations for the vendor and select the 'id' field
    const quotations = await Quotation.find({ vendor_id: vendorId }).select("id");

    if (!quotations || quotations.length === 0) {
      return res.status(200).json({
        success: true,
        unreadCounts: {},
        message: "No quotations found for this vendor.",
      });
    }

    const unreadCounts = {};
    for (const quotation of quotations) {
      // Use the 'id' field as the chatId
      const chatId = quotation.id;

      const messages = await Message.find({ chatId });
      const unreadCount = messages.filter(
        (msg) => !msg.readBy.includes(usertype)
      ).length;

      unreadCounts[chatId] = unreadCount;
    }

    return res.json({
      success: true,
      unreadCounts,
    });
  } catch (error) {
    console.error("Error fetching unread counts for vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
