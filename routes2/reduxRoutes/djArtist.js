import express from "express";
import { DjArtistReduxModel } from "../../models2/reduxModels/djArtist.js";

const router = express.Router();

/** DJ ARTIST DETAILS ROUTES **/

// POST or PUT route to save or update DJ artist details
// Route: /dj-artist-details/
router.post("/", async (req, res) => {
    const { vendor_id, djArtistData } = req.body; 
  
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }
  
    if (!djArtistData || Object.keys(djArtistData).length === 0) {
      return res.status(400).json({ message: "DJ artist details are required." });
    }

    try {
        const dataToSave = { 
            vendor_id, 
            ...djArtistData 
        };

        const updatedDetails = await DjArtistReduxModel.findOneAndUpdate(
          { vendor_id },
          dataToSave,
          { new: true, upsert: true }
        );
        
        const message = updatedDetails.isNew ? "DJ artist details saved successfully." : "DJ artist details updated successfully.";

        return res.status(200).json({
          message,
          data: updatedDetails,
        });

    } catch (error) {
      console.error("Error saving/updating DJ artist details:", error);
      res.status(500).json({
        message: "Failed to save or update DJ artist details.",
        error: error.message,
      });
    }
});
  
// GET route to retrieve DJ artist details by vendor ID
// Route: /dj-artist-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    try {
      const djArtistDetails = await DjArtistReduxModel.findOne({ vendor_id: vendor_id.trim() });
  
      if (!djArtistDetails) {
        return res.status(404).json({ message: "DJ artist details not found." });
      }
  
      res.status(200).json(djArtistDetails);
    } catch (error) {
      console.error("Error retrieving DJ artist details:", error);
      res.status(500).json({
        message: "Failed to retrieve DJ artist details.",
        error: error.message,
      });
    }
});
  
// DELETE route to remove DJ artist details by vendor ID
// Route: /dj-artist-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    if (!vendor_id || vendor_id.trim() === '') {
      return res.status(400).json({ message: "Vendor ID is required for deletion." });
    }
  
    try {
      const deletedDetails = await DjArtistReduxModel.findOneAndDelete({ vendor_id: vendor_id }); 
  
      if (!deletedDetails) {
        return res.status(404).json({ message: "DJ artist details not found for deletion." });
      }
  
      res.status(200).json({ message: "DJ artist details deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting DJ artist details:", error);
      res.status(500).json({
        message: "Failed to delete DJ artist details.",
        error: error.message,
      });
    }
});

export default router;