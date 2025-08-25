import express from "express";
import { ReduxMakeupArtistModel } from "../../models2/reduxModels/makeUpArtist.js";

const router = express.Router();

/** MAKEUP ARTIST DETAILS ROUTES **/

// POST or PUT route to save or update makeup artist details
// Route: /makeup-artist-details/
router.post("/", async (req, res) => {
  const { vendor_id, makeupArtistData } = req.body;

  // Validate vendor_id
  if (!vendor_id) {
    return res.status(400).json({ message: "Vendor ID is required." });
  }

  // Validate makeupArtistData
  if (!makeupArtistData || Object.keys(makeupArtistData).length === 0) {
    return res.status(400).json({ message: "Makeup artist details are required." });
  }

  try {
    // Prepare data
    const dataToSave = {
      vendor_id,
      ...makeupArtistData
    };

    // Perform DB upsert
    const updatedDetails = await ReduxMakeupArtistModel.findOneAndUpdate(
      { vendor_id },
      dataToSave,
      { new: true, upsert: true }
    );

    // Message based on whether new or updated
    const message = updatedDetails
      ? "Makeup artist details saved/updated successfully."
      : "New makeup artist created.";

    return res.status(200).json({
      message,
      data: updatedDetails,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to save or update makeup artist details.",
      error: error.message,
    });
  }
});
  
// GET route to retrieve makeup artist details by vendor ID
// Route: /makeup-artist-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    try {
      const makeupArtistDetails = await ReduxMakeupArtistModel.findOne({ vendor_id: vendor_id.trim() });
  
      if (!makeupArtistDetails) {
        return res.status(404).json({ message: "Makeup artist details not found." });
      }
  
      res.status(200).json(makeupArtistDetails);
    } catch (error) {
      console.error("Error retrieving makeup artist details:", error);
      res.status(500).json({
        message: "Failed to retrieve makeup artist details.",
        error: error.message,
      });
    }
});
  
// DELETE route to remove makeup artist details by vendor ID
// Route: /makeup-artist-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    if (!vendor_id || vendor_id.trim() === '') {
      return res.status(400).json({ message: "Vendor ID is required for deletion." });
    }
  
    try {
      const deletedDetails = await ReduxMakeupArtistModel.findOneAndDelete({ vendor_id: vendor_id }); 
  
      if (!deletedDetails) {
        return res.status(404).json({ message: "Makeup artist details not found for deletion." });
      }
  
      res.status(200).json({ message: "Makeup artist details deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting makeup artist details:", error);
      res.status(500).json({
        message: "Failed to delete makeup artist details.",
        error: error.message,
      });
    }
});

// Export the router so it can be used in other files
export default router;
