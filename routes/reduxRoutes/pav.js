import express from "express";
const router = express.Router();
import PAVModel  from "../../models/reduxStores/pav.js";  // Import the PAV model

// POST or PUT route to save or update PAV details
router.post("/", async (req, res) => {
    const { userId, pavData } = req.body;

    // Validate userId and pavData
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    if (!pavData || Object.keys(pavData).length === 0) {
        return res.status(400).json({ message: "PAV details are required." });
    }

    try {
        const existingDetails = await PAVModel.findOne({ userId });

        if (existingDetails) {
            const updatedDetails = await PAVModel.findOneAndUpdate(
                { userId },
                { $set: pavData },
                { new: true, upsert: false }
            );
            return res.status(200).json({ message: "PAV details updated successfully.", data: updatedDetails });
        } else {
            const newPAVDetails = new PAVModel({ userId, ...pavData });
            await newPAVDetails.save();
            return res.status(201).json({ message: "PAV details saved successfully.", data: newPAVDetails });
        }
    } catch (error) {
        console.error("Error saving/updating PAV details:", error);
        res.status(500).json({ message: "Failed to save or update PAV details.", error: error.message });
    }
});

// GET route to retrieve PAV details by user ID
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const pavDetails = await PAVModel.findOne({ userId });

        if (!pavDetails) {
            return res.status(404).json({ message: "PAV details not found." });
        }

        res.status(200).json(pavDetails);
    } catch (error) {
        console.error("Error retrieving PAV details:", error);
        res.status(500).json({ message: "Failed to retrieve PAV details.", error: error.message });
    }
});

// Export the router
export { router as pavRoutes };
