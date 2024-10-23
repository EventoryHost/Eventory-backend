// backend/routes/gifts.js
import express from "express";
const router = express.Router();
import GiftModel from "../../models/reduxStores/gifts.js";

// POST or PUT route to save or update gift details
router.post("/", async (req, res) => {
  const { userId, giftsData } = req.body;

  // Validate userId and giftsData
  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!giftsData || Object.keys(giftsData).length === 0) {
    return res.status(400).json({ message: "Gift details are required." });
  }

  try {
    const existingDetails = await GiftModel.findOne({ userId });

    if (existingDetails) {
      const updatedDetails = await GiftModel.findOneAndUpdate(
        { userId },
        { $set: giftsData },
        { new: true, upsert: false },
      );
      return res
        .status(200)
        .json({
          message: "Gift details updated successfully.",
          data: updatedDetails,
        });
    } else {
      const newGiftDetails = new GiftModel({ userId, ...giftsData });
      await newGiftDetails.save();
      return res
        .status(201)
        .json({
          message: "Gift details saved successfully.",
          data: newGiftDetails,
        });
    }
  } catch (error) {
    console.error("Error saving/updating gift details:", error);
    res
      .status(500)
      .json({
        message: "Failed to save or update gift details.",
        error: error.message,
      });
  }
});

// GET route to retrieve gift details by user ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const giftDetails = await GiftModel.findOne({ userId });

    if (!giftDetails) {
      return res.status(404).json({ message: "Gift details not found." });
    }

    res.status(200).json(giftDetails);
  } catch (error) {
    console.error("Error retrieving gift details:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve gift details.",
        error: error.message,
      });
  }
});

// Export the router
export { router as giftRoutes };
