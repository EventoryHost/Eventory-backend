import express from "express";
import {
  getVendorNotifications,
  markVendorNotificationsAsRead,
  markNotificationAsRead,
  deleteVendorNotification,
  getUnreadCount,
} from "../controllers2/vendorNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}:
 *   get:
 *     summary: Get all notifications for a vendor
 *     tags: [Vendor Notifications]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       400:
 *         description: vendor_id is required
 *       500:
 *         description: Server error
 */
router.get("/:vendor_id", getVendorNotifications);

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}/unread-count:
 *   get:
 *     summary: Get unread notification count for a vendor
 *     tags: [Vendor Notifications]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
 *       400:
 *         description: vendor_id is required
 *       500:
 *         description: Server error
 */
router.get("/:vendor_id/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/vendor-notifications/{vendor_id}/mark-all-read:
 *   patch:
 *     summary: Mark all vendor notifications as read
 *     tags: [Vendor Notifications]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: vendor_id is required
 *       500:
 *         description: Server error
 */
router.patch("/:vendor_id/mark-all-read", markVendorNotificationsAsRead);

/**
 * @swagger
 * /api/vendor-notifications/notification/{notification_id}/mark-read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Vendor Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch("/notification/:notification_id/mark-read", markNotificationAsRead);

/**
 * @swagger
 * /api/vendor-notifications/notification/{notification_id}:
 *   delete:
 *     summary: Delete a specific notification
 *     tags: [Vendor Notifications]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete("/notification/:notification_id", deleteVendorNotification);

export default router;

