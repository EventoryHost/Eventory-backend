import express from "express";
import { ReduxDecoratorModel } from "../../models2/reduxModels/decorator.js";

const router = express.Router();

/** DECORATOR DETAILS ROUTES **/

// POST or PUT route to save or update decorator details
// Route: /decorator-details/
router.post("/", async (req, res) => {
    const { vendor_id, decoratorData } = req.body; 
  
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }
  
    if (!decoratorData || Object.keys(decoratorData).length === 0) {
      return res.status(400).json({ message: "Decorator details are required." });
    }

    try {
        const dataToSave = { 
            vendor_id, 
            ...decoratorData 
        };

        const updatedDetails = await ReduxDecoratorModel.findOneAndUpdate(
          { vendor_id },
          dataToSave,
          { new: true, upsert: true }
        );
        
        const message = updatedDetails.isNew ? "Decorator details saved successfully." : "Decorator details updated successfully.";

        return res.status(200).json({
          message,
          data: updatedDetails,
        });

    } catch (error) {
      console.error("Error saving/updating decorator details:", error);
      res.status(500).json({
        message: "Failed to save or update decorator details.",
        error: error.message,
      });
    }
});
  
// GET route to retrieve decorator details by vendor ID
// Route: /decorator-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    try {
      const decoratorDetails = await ReduxDecoratorModel.findOne({ vendor_id: vendor_id.trim() });
  
      if (!decoratorDetails) {
        return res.status(404).json({ message: "Decorator details not found." });
      }
  
      res.status(200).json(decoratorDetails);
    } catch (error) {
      console.error("Error retrieving decorator details:", error);
      res.status(500).json({
        message: "Failed to retrieve decorator details.",
        error: error.message,
      });
    }
});
  
// DELETE route to remove decorator details by vendor ID
// Route: /decorator-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    if (!vendor_id || vendor_id.trim() === '') {
      return res.status(400).json({ message: "Vendor ID is required for deletion." });
    }
  
    try {
      const deletedDetails = await ReduxDecoratorModel.findOneAndDelete({ vendor_id: vendor_id }); 
  
      if (!deletedDetails) {
        return res.status(404).json({ message: "Decorator details not found for deletion." });
      }
  
      res.status(200).json({ message: "Decorator details deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting decorator details:", error);
      res.status(500).json({
        message: "Failed to delete decorator details.",
        error: error.message,
      });
    }
});

export default router;
