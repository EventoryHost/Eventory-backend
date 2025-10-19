import express from "express";
import EMNotifications from "../models2/emNotifications.js";
import EventManager from "../models2/eventManager.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; 
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
router.post("/emauth", async (req, res) => {
  const { user_name, password } = req.body; // Destructure the request body

  // Input validation: check if username and password are provided
  if (!user_name || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    // 1️⃣ Find user by username
    const user = await EventManager.findOne({ user_name });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password); 

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      {
        em_id: user.em_id,
        user_name: user.user_name,
        contact_name: user.contact_name,
        role: "rmadmin",
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7-day expiry
    );

    // 4️⃣ Return token + user info
    return res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      token,
      user: {
        em_id: user.em_id,
        user_name: user.user_name,
        contact_name: user.contact_name,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

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
router.get("/:em_id/emNotifications", async (req, res) => {
  const { em_id } = req.params;

  try {
    if (!em_id) {
      return res.status(400).json({
        success: false,
        message: "em_id is required",
      });
    }

    const notifications = await EMNotifications
      .find({ em_id })
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
router.put("/emNotifications/markAsRead", async (req, res) => {
  const { em_id } = req.body;

  if (!em_id) {
    return res.status(400).json({ message: "em_id is required" });
  }

  try {
    await EMNotifications.updateMany(
      { em_id: em_id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Failed to mark notifications as read:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
