import express from "express";
const router = express.Router();
import PAVModel from "../../models/reduxStores/pav.js"; // Import the PAV model

// POST or PUT route to save or update PAV details
router.post("/", async (req, res) => {
  const { id, pavData } = req.body;

  // Validate id and pavData
  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!pavData || Object.keys(pavData).length === 0) {
    return res.status(400).json({ message: "PAV details are required." });
  }

  try {
    const existingDetails = await PAVModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await PAVModel.findOneAndUpdate(
        { id },
        { $set: pavData },
        { new: true, upsert: false },
      );
      return res.status(200).json({
        message: "PAV details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newPAVDetails = new PAVModel({ id, ...pavData });
      await newPAVDetails.save();
      return res.status(201).json({
        message: "PAV details saved successfully.",
        data: newPAVDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating PAV details:", error);
    res.status(500).json({
      message: "Failed to save or update PAV details.",
      error: error.message,
    });
  }
});

// GET route to retrieve PAV details by user ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pavDetails = await PAVModel.findOne({ id });

    if (!pavDetails) {
      return res.status(404).json({ message: "PAV details not found." });
    }

    res.status(200).json(pavDetails);
  } catch (error) {
    console.error("Error retrieving PAV details:", error);
    res.status(500).json({
      message: "Failed to retrieve PAV details.",
      error: error.message,
    });
  }
});

// DELETE route to remove decorator details by user ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Deleting decorator details for ID:", id);

  if (!id) {
    return res.status(400).json({ message: "User ID is required for deletion." });
  }

  try {
    // Use findOneAndDelete with a filter object
    const deletedDetails = await PAVModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res.status(404).json({ message: "PAV details not found for deletion." });
    }

    console.log("✅ Deleted decorator details:", deletedDetails);
    res.status(200).json({ message: "PAV details deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting PAV details:", error);
    res.status(500).json({
      message: "Failed to delete PAV details.",
      error: error.message,
    });
  }
});

// Export the router
export { router as pavRoutes };
