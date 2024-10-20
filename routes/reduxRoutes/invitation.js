// backend/routes/invitation.js
import express from "express";
const router = express.Router();
import { InvitationModel }  from "../../models/reduxStores/invitation.js";  // New Invitation model

// POST or PUT route to save or update invitation details
router.post("/", async (req, res) => {
    const { userId, invitationData } = req.body;

    // Validate userId and invitationData
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    if (!invitationData || Object.keys(invitationData).length === 0) {
        return res.status(400).json({ message: "Invitation details are required." });
    }

    try {
        const existingDetails = await InvitationModel.findOne({ userId });

        if (existingDetails) {
            const updatedDetails = await InvitationModel.findOneAndUpdate(
                { userId },
                { $set: invitationData },
                { new: true, upsert: false }
            );
            return res.status(200).json({ message: "Invitation details updated successfully.", data: updatedDetails });
        } else {
            const newInvitationDetails = new InvitationModel({ userId, ...invitationData });
            await newInvitationDetails.save();
            return res.status(201).json({ message: "Invitation details saved successfully.", data: newInvitationDetails });
        }
    } catch (error) {
        console.error("Error saving/updating invitation details:", error);
        res.status(500).json({ message: "Failed to save or update invitation details.", error: error.message });
    }
});

// GET route to retrieve invitation details by user ID
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const invitationDetails = await InvitationModel.findOne({ userId });

        if (!invitationDetails) {
            return res.status(404).json({ message: "Invitation details not found." });
        }

        res.status(200).json(invitationDetails);
    } catch (error) {
        console.error("Error retrieving invitation details:", error);
        res.status(500).json({ message: "Failed to retrieve invitation details.", error: error.message });
    }
});

// Export the router
export { router as invitationRoutes };
