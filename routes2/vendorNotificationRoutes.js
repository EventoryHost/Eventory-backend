import express from "express";
import {
  getVendorNotifications,
  markVendorNotificationAsRead,
  markAllVendorNotificationsAsRead,
} from "../controllers2/vendorNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}:
 *   get:
 *     summary: Get vendor notifications
 *     tags: [Vendor Notifications]
 */
router.get("/:vendor_id", getVendorNotifications);

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}/mark-all-read:
 *   patch:
 *     summary: Mark all vendor notifications as read
 *     tags: [Vendor Notifications]
 */
router.patch("/:vendor_id/mark-all-read", markAllVendorNotificationsAsRead);

/**
 * @swagger
 * /api/vendor-notifications/read/{notificationId}:
 *   patch:
 *     summary: Mark specific vendor notification as read
 *     tags: [Vendor Notifications]
 */
router.patch("/read/:notificationId", markVendorNotificationAsRead);

export default router;