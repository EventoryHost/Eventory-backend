// backend/routes/reduxRoutes/venue-provider.js
import express from "express";
const router = express.Router();
import VenueModel from "../../models/reduxStores/venue-provider.js"; // Assuming the Venue schema/model is defined in this path

// POST or PUT route to save or update venue details
router.post("/", async (req, res) => {
  const { id, venueData } = req.body;

  // Validate id and venueData
  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!venueData || Object.keys(venueData).length === 0) {
    return res.status(400).json({ message: "Venue details are required." });
  }

  try {
    const existingDetails = await VenueModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await VenueModel.findOneAndUpdate(
        { id },
        { $set: venueData },
        { new: true, upsert: false },
      );
      return res.status(200).json({
        message: "Venue details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newVenueDetails = new VenueModel({ id, ...venueData });
      await newVenueDetails.save();
      return res.status(201).json({
        message: "Venue details saved successfully.",
        data: newVenueDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating venue details:", error);
    res.status(500).json({
      message: "Failed to save or update venue details.",
      error: error.message,
    });
  }
});

// GET route to retrieve venue details by user ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const venueDetails = await VenueModel.findOne({ id });

    if (!venueDetails) {
      return res.status(404).json({ message: "Venue details not found." });
    }

    res.status(200).json(venueDetails);
  } catch (error) {
    console.error("Error retrieving venue details:", error);
    res.status(500).json({
      message: "Failed to retrieve venue details.",
      error: error.message,
    });
  }
});

// DELETE route to remove decorator details by user ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Deleting decorator details for ID:", id);

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required for deletion." });
  }

  try {
    // Use findOneAndDelete with a filter object
    const deletedDetails = await VenueModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "Venue details not found for deletion." });
    }

    console.log("✅ Deleted decorator details:", deletedDetails);
    res.status(200).json({ message: "Venue details deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting Venue details:", error);
    res.status(500).json({
      message: "Failed to delete Venue details.",
      error: error.message,
    });
  }
});

// Export the router
export { router as venueRoutes };
