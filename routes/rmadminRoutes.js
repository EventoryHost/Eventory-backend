import rmadmin from "../models/rmadmin.js";
import express from "express";

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
    return res
      .status(200)
      .json({
        success: true,
        message: "User authenticated successfully",
        user,
      });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
