import rmadmin from "../models/rmadmin.js";
import express from "express";
import adminNotification from "../models/adminNotification.js";

const router = express.Router();

/**
 * @swagger
 * /api/rmauth:
 *   post:
 *     summary: Authenticate RM admin user
 *     tags:
 *       - RM Admin
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
router.post("/rmauth", async (req, res) => {
  const { username, password } = req.body; // Destructure the request body

  // Input validation: check if username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    // Find the user by username in the rmadmin model
    const user = await rmadmin.findOne({ username });

    if (!user) {
      // If the user does not exist
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // If user exists (without password comparison)
    return res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      user: {
        adminId: user.adminId,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /api/{adminId}/adminNotifications:
 *   get:
 *     summary: Get notifications for an admin
 *     tags:
 *       - RM Admin
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
router.get("/:adminId/adminNotifications", async (req, res) => {
  const { adminId } = req.params;

  try {
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required",
      });
    }

    const notifications = await adminNotification
      .find({ adminId })
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


/**
 * @swagger
 * /api/adminNotifications/markAsRead:
 *   put:
 *     summary: Mark all unread notifications as read
 *     tags:
 *       - RM Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: adminId is required
 *       500:
 *         description: Server error
 */

// PUT /api/adminNotifications/markAsRead
router.put("/adminNotifications/markAsRead", async (req, res) => {
  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ message: "adminId is required" });
  }

  try {
    await adminNotification.updateMany(
      { adminId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Failed to mark notifications as read:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
