// backend/routes/prop-rental.js
import express from "express";
const router = express.Router();
import PropRentalModel  from "../../models/reduxStores/prop-rental.js";

// POST or PUT route to save or update prop rental details
router.post("/", async (req, res) => {
    const { userId, propRentalData } = req.body;

    // Validate userId and propRentalData
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    if (!propRentalData || Object.keys(propRentalData).length === 0) {
        return res.status(400).json({ message: "Prop rental details are required." });
    }

    try {
        const existingDetails = await PropRentalModel.findOne({ userId });

        if (existingDetails) {
            const updatedDetails = await PropRentalModel.findOneAndUpdate(
                { userId },
                { $set: propRentalData },
                { new: true, upsert: false }
            );
            return res.status(200).json({ message: "Prop rental details updated successfully.", data: updatedDetails });
        } else {
            const newPropRentalDetails = new PropRentalModel({ userId, ...propRentalData });
            await newPropRentalDetails.save();
            return res.status(201).json({ message: "Prop rental details saved successfully.", data: newPropRentalDetails });
        }
    } catch (error) {
        console.error("Error saving/updating prop rental details:", error);
        res.status(500).json({ message: "Failed to save or update prop rental details.", error: error.message });
    }
});

// GET route to retrieve prop rental details by user ID
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const propRentalDetails = await PropRentalModel.findOne({ userId });

        if (!propRentalDetails) {
            return res.status(404).json({ message: "Prop rental details not found." });
        }

        res.status(200).json(propRentalDetails);
    } catch (error) {
        console.error("Error retrieving prop rental details:", error);
        res.status(500).json({ message: "Failed to retrieve prop rental details.", error: error.message });
    }
});

// Export the router
export { router as propRentalRoutes };
