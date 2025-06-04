import Sales from "../models/sales.js";
import express from "express";

const router = express.Router();

// POST route for checking if a sales user exists
router.post('/salesauth', async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    // Find the user by username in the sales model
    const user = await Sales.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user exists (without password comparison)
    return res.status(200).json({ 
      success: true, 
      message: 'Sales user authenticated successfully', 
      user 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
