import rmadmin from "../models/rmadmin.js";
import express from "express";
import adminNotification from "../models/adminNotification.js";

const router = express.Router();

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
