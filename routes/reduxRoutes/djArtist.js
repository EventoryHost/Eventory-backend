import express from "express";
const router = express.Router();
import DjArtistModel from "../../models/reduxStores/djArtist.js";

router.post("/", async (req, res) => {
    const { id, data } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required." });
    }
    
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ message: "DJ artist details are required." });
    }

    try {
        console.log("Saving/updating DJ artist details for id:", id);
        
        const updatedDetails = await DjArtistModel.findOneAndUpdate(
            { id },
            { $set: data },
            { 
                new: true, 
                upsert: true,
                setDefaultsOnInsert: true 
            }
        );

        return res.status(200).json({
            message: "DJ artist details saved successfully.",
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



router.get('/:id', async (req, res) => {
    const { id } = req.params;    
    try {
        console.log("Finding Dj artist details for id:", id);
        const djArtistDetails = await DjArtistModel.findOne({ id });
        
        if (!djArtistDetails) {
            console.log("No dj artist details found for id:", id);
            return res.status(404).json({ message: "DJ artist details not found." });
        }
        console.log("Found dj artist details:", djArtistDetails.address);
        res.status(200).json(djArtistDetails);
        
    } catch (error) {
        console.error("Error finding DJ artist details:", error);
        res.status(500).json({
            message: "Failed to find DJ artist details.",
            error: error.message,
        });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        console.log("Error: User ID is required.");
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        console.log("Deleting DJ artist details for id:", id);
        const deletedDetails = await DjArtistModel.findOneAndDelete({ id });

        if (!deletedDetails) {
            console.log("No dj artist details found for id:", id);
            return res.status(404).json({ message: "DJ artist details not found." });
        }
        
        console.log("Deleted dj artist details:", deletedDetails);
        res.status(200).json({
            message: "Dj artist details deleted successfully.",
            data: deletedDetails,
        });
    } catch (error) {
        console.error("Error deleting DJ artist details:", error);
        res.status(500).json({
            message: "Failed to delete DJ artist details.",
            error: error.message,
        });
    }
});

export { router as djArtistRoutes };