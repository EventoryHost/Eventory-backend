import express from "express";
import {
  getCustomerNotifications,
  markCustomerNotificationsAsRead,
  markNotificationAsRead,
  getUnreadCount,
} from "../controllers/customerNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/customer-notifications/{customer_id}:
 *   get:
 *     summary: Get all notifications for a customer
 *     tags: [Customer Notifications]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       400:
 *         description: customer_id is required
 *       500:
 *         description: Server error
 */
router.get("/:customer_id", getCustomerNotifications);

/**
 * @swagger
 * /api/customer-notifications/{customer_id}/unread-count:
 *   get:
 *     summary: Get unread notification count for a customer
 *     tags: [Customer Notifications]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
 *       400:
 *         description: customer_id is required
 *       500:
 *         description: Server error
 */
router.get("/:customer_id/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/customer-notifications/{customer_id}/mark-all-read:
 *   patch:
 *     summary: Mark all customer notifications as read
 *     tags: [Customer Notifications]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: customer_id is required
 *       500:
 *         description: Server error
 */
router.patch("/:customer_id/mark-all-read", markCustomerNotificationsAsRead);

/**
 * @swagger
 * /api/customer-notifications/notification/{notification_id}/mark-read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Customer Notifications]
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
router.patch(
  "/notification/:notification_id/mark-read",
  markNotificationAsRead,
);

export default router;
