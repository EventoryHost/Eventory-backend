import express from "express";
import {
  authenticateEMAdmin,
  getEMNotifications,
  markAllNotificationsAsRead,
  getEMProfile,
  updateEMProfile,
} from "../controllers2/emadminController.js";

const router = express.Router(); 
/**
 * @swagger
 * /api/EMauth:
 *   post:
 *     summary: Authenticate EM admin user
 *     tags:
 *       - EM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Missing username or password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// POST route for checking if a user exists
router.post("/emauth", authenticateEMAdmin);

/**
 * @swagger
 * /api/{adminId}/emNotifications:
 *   get:
 *     summary: Get notifications for an admin
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: adminId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the admin
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       400:
 *         description: adminId is required
 *       500:
 *         description: Server error
 */

// GET route to fetch notifications by adminId
router.get("/:em_id/emNotifications", getEMNotifications);


/**
 * @swagger
 * /api/emNotifications/markAsRead:
 *   put:
 *     summary: Mark all unread notifications as read
 *     tags:
 *       - EM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               em_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: em_id is required
 *       500:
 *         description: Server error
 */

// PUT /api/emNotifications/markAsRead
router.put("/emNotifications/markAsRead", markAllNotificationsAsRead);

/**
 * @swagger
 * /api/emProfile/{em_id}:
 *   get:
 *     summary: Get Event Manager Profile
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: em_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event Manager ID
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get("/em_profile/:em_id", getEMProfile);

/**
 * @swagger
 * /api/emProfile/{em_id}:
 *   put:
 *     summary: Update Event Manager Profile
 *     tags:
 *       - EM Admin
 *     parameters:
 *       - in: path
 *         name: em_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event Manager ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contact_name:
 *                 type: string
 *               contact_number:
 *                 type: string
 *               role:
 *                 type: string
 *               bio:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *               yoe:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Missing fields
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put("/em_profile/:em_id", updateEMProfile);



export default router;
