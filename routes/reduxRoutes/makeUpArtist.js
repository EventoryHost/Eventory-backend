import express from "express";
const router = express.Router();
import createMakeupArtistSchema from "../../models/reduxStores/makeupArtist.js";  // Import the factory function

// POST or PUT route to save or update makeup artist details
router.post("/", async (req, res) => {
    const { userId, makeupArtistData } = req.body;

    // Validate userId and makeupArtistData
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    if (!makeupArtistData || Object.keys(makeupArtistData).length === 0) {
        return res.status(400).json({ message: "Makeup artist details are required." });
    }

    try {
        // Create a model instance based on the artist type
        const MakeupArtistModel = createMakeupArtistSchema(makeupArtistData.type);  // Pass the artist type

        const existingDetails = await MakeupArtistModel.findOne({ userId });

        if (existingDetails) {
            const updatedDetails = await MakeupArtistModel.findOneAndUpdate(
                { userId },
                { $set: makeupArtistData },
                { new: true, upsert: false }
            );
            return res.status(200).json({ message: "Makeup artist details updated successfully.", data: updatedDetails });
        } else {
            const newMakeupArtistDetails = new MakeupArtistModel({ userId, ...makeupArtistData });
            await newMakeupArtistDetails.save();
            return res.status(201).json({ message: "Makeup artist details saved successfully.", data: newMakeupArtistDetails });
        }
    } catch (error) {
        console.error("Error saving/updating makeup artist details:", error);
        res.status(500).json({ message: "Failed to save or update makeup artist details.", error: error.message });
    }
});

// GET route to retrieve makeup artist details by user ID
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const MakeupArtistModel = createMakeupArtistSchema("individual");  // Adjust based on your requirement

        const makeupArtistDetails = await MakeupArtistModel.findOne({ userId });

        if (!makeupArtistDetails) {
            return res.status(404).json({ message: "Makeup artist details not found." });
        }

        res.status(200).json(makeupArtistDetails);
    } catch (error) {
        console.error("Error retrieving makeup artist details:", error);
        res.status(500).json({ message: "Failed to retrieve makeup artist details.", error: error.message });
    }
});

// Export the router
export { router as makeupArtistRoutes };
