import express from "express";
import {
  getVendorNotifications,
  markVendorNotificationAsRead,
  markAllVendorNotificationsAsRead,
  getVendorNotificationsByService,
} from "../controllers/vendorNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}/{service_id}:
 *   get:
 *     summary: Get vendor notifications for a specific service
 *     tags: [Vendor Notifications]
 */
router.get(
  "/:vendor_id/:service_id/vendor_notification",
  getVendorNotificationsByService,
);
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
