import express from "express";
import {
  getEMNotifications,
  markEMNotificationAsRead,
  markAllEMNotificationsAsRead,
} from "../controllers/emNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/em-notifications/{em_id}:
 *   get:
 *     summary: Get EM notifications
 *     tags: [EM Notifications]
 */
router.get("/:em_id", getEMNotifications);

/**
 * @swagger
 * /api/em-notifications/{em_id}/mark-all-read:
 *   patch:
 *     summary: Mark all EM notifications as read
 *     tags: [EM Notifications]
 */
router.patch("/:em_id/mark-all-read", markAllEMNotificationsAsRead);

/**
 * @swagger
 * /api/em-notifications/read/{notificationId}:
 *   patch:
 *     summary: Mark specific EM notification as read
 *     tags: [EM Notifications]
 */
router.patch("/read/:notificationId", markEMNotificationAsRead);

export default router;
