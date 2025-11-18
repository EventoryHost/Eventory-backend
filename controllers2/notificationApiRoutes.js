import { Router } from "express";
import { markAsReadAndDelete } from "./notification.controller";

const router = Router();

/**
 * Endpoint for the client to delete a notification when it's viewed/read.
 * Route: POST /api/notifications/read-and-delete/:notificationId
 * * The client will pass the notification ID in the path and the user type 
 * (vendor, customer, or em) as a query parameter (e.g., ?type=vendor).
 */
router.post('/read-and-delete/:notificationId', markAsReadAndDelete);

export default router;