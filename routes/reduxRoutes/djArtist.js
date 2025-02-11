import express from "express";
const router = express.Router();
import DjArtistModel from "../../models/reduxStores/djArtist.js";

router.post("/", async (req, res) => {
    const { id, data } = req.body;

    if (!id) {
        console.log("Error: User ID is required.");
        return res.status(400).json({ message: "User ID is required." });
    }
    
    if (!data || Object.keys(data).length === 0) {
        console.log("Error: DJ artist details are required.");
        return res.status(400).json({ message: "DJ artist details are required." });
    }

    try {
        console.log("Finding existing DJ artist details for id:", id);
        const existingDetails = await DjArtistModel.findOne({ id });

        if (existingDetails) {
            console.log("Found existing details for id:", id);
            console.log("Updating DJ artist details:", data);
            const updatedDetails = await DjArtistModel.findOneAndUpdate(
                { id },
                { $set: data },
                { new: true, upsert: false },
            );
            console.log("Updated details:", updatedDetails);
            return res.status(200).json({
                message: "Dj artist details updated successfully.",
                data: updatedDetails,
              });
        } else {
            console.log("Creating new DJ artist details for id:", id);
            const newDetails = await DjArtistModel.create({ id, ...data });
            return res.json(newDetails);
        }
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
    console.log("Finding DJ artist details for id:", id);
    
    try {
        console.log("Finding Dj artist details for id:", id);
        const djArtistDetails = await DjArtistModel.findOne({ id });
        
        if (!djArtistDetails) {
            console.log("No dj artist details found for id:", id);
            return res.status(404).json({ message: "DJ artist details not found." });
        }
        console.log("Found dj artist details:", makeupArtistDetails);
        res.status(200).json(djArtistDetails);
        
    } catch (error) {
        console.error("Error finding DJ artist details:", error);
        res.status(500).json({
            message: "Failed to find DJ artist details.",
            error: error.message,
        });
    }
});

export { router as djArtistRoutes };