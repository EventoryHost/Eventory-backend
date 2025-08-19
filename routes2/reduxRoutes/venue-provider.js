import express from "express";
import  { ReduxVenueProviderModel }  from "../../models2/reduxModels/venueProvider.js";

const router = express.Router();

/** VENUE PROVIDER DETAILS ROUTES **/

// POST or PUT route to save or update venue provider details
// Route: /venue-provider-details/
router.post("/", async (req, res) => {
    // Use the top-level vendor_id as the canonical source
    const { vendor_id, venueProviderData } = req.body; 
  
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }
  
    if (!venueProviderData || Object.keys(venueProviderData).length === 0) {
      return res.status(400).json({ message: "Venue details are required." });
    }

    try {
        // Create a data object for the update/create operation.
        // This ensures the vendor_id from the top-level body is used.
        const dataToSave = { 
            vendor_id, 
            ...venueProviderData 
        };

        // Find and update the existing document, or create a new one if not found.
        const updatedDetails = await ReduxVenueProviderModel.findOneAndUpdate(
          { vendor_id },
          dataToSave,
          { new: true, upsert: true }
        );
        
        // This response works for both creation and update.
        const message = updatedDetails.isNew ? "Venue details saved successfully." : "Venue details updated successfully.";

        return res.status(200).json({
          message,
          data: updatedDetails,
        });

    } catch (error) {
      console.error("Error saving/updating venue details:", error);
      res.status(500).json({
        message: "Failed to save or update venue details.",
        error: error.message,
      });
    }
});
  
// GET route to retrieve venue details by vendor ID
// Route: /venue-provider-details/:vendor_id
router.get("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    try {
      const venueDetails = await ReduxVenueProviderModel.findOne({ vendor_id: vendor_id.trim() });
  
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
  
// DELETE route to remove venue details by vendor ID
// Route: /venue-provider-details/:vendor_id
router.delete("/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;
  
    if (!vendor_id || vendor_id.trim() === '') {
      return res.status(400).json({ message: "Vendor ID is required for deletion." });
    }
  
    try {
      const deletedDetails = await ReduxVenueProviderModel.findOneAndDelete({ vendor_id: vendor_id }); 
  
      if (!deletedDetails) {
        return res.status(404).json({ message: "Venue details not found for deletion." });
      }
  
      res.status(200).json({ message: "Venue details deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting venue details:", error);
      res.status(500).json({
        message: "Failed to delete venue details.",
        error: error.message,
      });
    }
});

// Export the router so it can be used in other files
export default router;
