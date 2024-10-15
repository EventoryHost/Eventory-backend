// backend/routes/businessDetails.js
import express from "express";
const router = express.Router();
import { BusinessDetailsModel } from "../models/reduxStores/businessDetails.js";
import { CateringModel } from "../models/reduxStores/Catering.js";
// POST or PUT route to save or update business details
router.post("/business-details", async (req, res) => {
    const { userId, businessDetails2 } = req.body;

    if (!businessDetails2) {
        return res.status(400).json({ message: "Please provide business details." });
    }

    const { businessName, category, gstin, years, businessAddress, teamsize, annualrevenue, pinCode, cities } = businessDetails2;

    try {
        const existingDetails = await BusinessDetailsModel.findOne({ userId });

        if (existingDetails) {
            await BusinessDetailsModel.findOneAndUpdate(
                { userId },
                {
                    businessName,
                    category,
                    gstin,
                    teamsize,
                    businessAddress,
                    pinCode,
                    cities,
                    years,
                    annualrevenue,
                },
                { new: true }
            );
            return res.status(200).json({ message: "Business details updated successfully." });
        } else {
            const newBusinessDetails = new BusinessDetailsModel({
                userId,
                businessName,
                category,
                gstin,
                teamsize,
                businessAddress,
                pinCode,
                cities,
                years,
                annualrevenue,
            });

            await newBusinessDetails.save();
            return res.status(201).json({ message: "Business details saved successfully." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save or update business details." });
    }
});

// Route to fetch business details by userId
router.get("/business-details/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const businessDetails = await BusinessDetailsModel.findOne({ userId });
        if (businessDetails) {
            res.status(200).json(businessDetails);
        } else {
            res.status(404).json({ message: "Business details not found." });
        }
    } catch (error) {
        console.error("Error fetching business details:", error);
        res.status(500).json({ message: "Failed to fetch business details." });
    }
});


/** CATERING DETAILS ROUTES **/

// POST or PUT route to save or update catering details
router.post("/catering-details", async (req, res) => {
    const { userId, cateringData } = req.body; // Extracting cateringData from the nested structure

    // Validate userId and cateringData
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    if (!cateringData || Object.keys(cateringData).length === 0) {
        return res.status(400).json({ message: "Catering details are required." });
    }

    try {
        // Check if the catering details already exist
        const existingDetails = await CateringModel.findOne({ userId });

        if (existingDetails) {
            // Update existing catering details
            const updatedDetails = await CateringModel.findOneAndUpdate(
                { userId },
                { $set: cateringData }, // Explicitly set the fields to update
                { new: true, upsert: false } // No need for upsert here since it already exists
            );
            return res.status(200).json({ message: "Catering details updated successfully.", data: updatedDetails });
        } else {
            // Create new catering details
            const newCateringDetails = new CateringModel({ userId, ...cateringData });
            await newCateringDetails.save();
            return res.status(201).json({ message: "Catering details saved successfully.", data: newCateringDetails });
        }
    } catch (error) {
        console.error("Error saving/updating catering details:", error);
        res.status(500).json({ message: "Failed to save or update catering details.", error: error.message });
    }
});

// GET route to retrieve catering details by user ID
router.get("/catering-details/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const cateringDetails = await CateringModel.findOne({ userId });

        if (!cateringDetails) {
            return res.status(404).json({ message: "Catering details not found." });
        }

        res.status(200).json(cateringDetails);
    } catch (error) {
        console.error("Error retrieving catering details:", error);
        res.status(500).json({ message: "Failed to retrieve catering details.", error: error.message });
    }
});

// Export the router
export { router as businessDetailsRoutes };
