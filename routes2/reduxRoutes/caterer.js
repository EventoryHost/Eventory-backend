import express from "express";
import { ReduxCatererModel } from "../../models2/reduxModels/caterer.js";

const router = express.Router();

/** CATERING DETAILS ROUTES **/

// POST or PUT route to save or update catering details
// Route: /catering-details/
router.post("/catering-details", async (req, res) => {
    // We'll use the top-level vendor_id as the canonical source
    const { vendor_id, cateringData } = req.body; 
  
    console.log("vendor_id", vendor_id);
  
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }
  
    if (!cateringData || Object.keys(cateringData).length === 0) {
      return res.status(400).json({ message: "Catering details are required." });
    }

    try {
        // Create a new data object for the update/create operation.
        // This ensures the vendor_id from the top-level body is used,
        // preventing the nested vendor_id from overwriting it.
        const dataToSave = { 
            vendor_id, 
            ...cateringData 
        };

        // Find and update the existing document. The `upsert: true` option
        // will create a new document if one isn't found. This single call
        // replaces the separate findOne and create/update logic.
        const updatedDetails = await ReduxCatererModel.findOneAndUpdate(
          { vendor_id },
          dataToSave,
          { new: true, upsert: true } // `upsert: true` is key here
        );
        
        // This response works for both creation and update
        const message = updatedDetails.isNew ? "Catering details saved successfully." : "Catering details updated successfully.";

        return res.status(200).json({
          message,
          data: updatedDetails,
        });

    } catch (error) {
      console.error("Error saving/updating catering details:", error);
      res.status(500).json({
        message: "Failed to save or update catering details.",
        error: error.message,
      });
    }
});
  
// GET route to retrieve catering details by vendor ID
// Route: /catering-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    try {
      const cateringDetails = await ReduxCatererModel.findOne({ vendor_id: vendor_id.trim() });
  
      if (!cateringDetails) {
        return res.status(404).json({ message: "Catering details not found." });
      }
  
      res.status(200).json(cateringDetails);
    } catch (error) {
      console.error("Error retrieving catering details:", error);
      res.status(500).json({
        message: "Failed to retrieve catering details.",
        error: error.message,
      });
    }
});
  
// DELETE route to remove catering details by vendor ID
// Route: /catering-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    console.log("Deleting catering details for Vendor ID:", vendor_id);
  
    if (!vendor_id || vendor_id.trim() === '') {
      return res.status(400).json({ message: "Vendor ID is required for deletion." });
    }
  
    try {
      const deletedDetails = await ReduxCatererModel.findOneAndDelete({ vendor_id: vendor_id }); 
  
      if (!deletedDetails) {
        return res.status(404).json({ message: "Catering details not found for deletion." });
      }
  
      res.status(200).json({ message: "Catering details deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting catering details:", error);
      res.status(500).json({
        message: "Failed to delete catering details.",
        error: error.message,
      });
    }
});

// Export the router so it can be used in other files
export default router;
