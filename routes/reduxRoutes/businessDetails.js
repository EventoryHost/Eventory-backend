// backend/routes/businessDetails.js
import express from "express";
const router = express.Router();
import { BusinessDetailsModel } from "../../models/reduxStores/businessDetails.js";
import { CateringModel } from "../../models/reduxStores/catering.js";
import { decoratorRoutes } from "./decorator.js";
import { giftRoutes } from "./gifts.js";
import { venueRoutes } from "./venue-provider.js";
import { pavRoutes } from "./pav.js";
import { makeupArtistRoutes } from "./makeUpArtist.js";
import { djArtistRoutes } from "./djArtist.js";
import { propRentalRoutes } from "./prop-rental.js";
import { invitationRoutes } from "./invitation.js";


/**
 * @swagger
 * /api/business-details:
 *   post:
 *     summary: Save or update business details
 *     tags: [BusinessDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, businessDetails2]
 *             properties:
 *               id:
 *                 type: string
 *               businessDetails2:
 *                 type: object
 *                 properties:
 *                   businessName:
 *                     type: string
 *                   category:
 *                     type: string
 *                   gstin:
 *                     type: string
 *                   panNo:
 *                     type: string
 *                   years:
 *                     type: string
 *                   businessAddress:
 *                     type: string
 *                   teamsize:
 *                     type: string
 *                   annualrevenue:
 *                     type: string
 *                   pinCode:
 *                     type: string
 *                   cities:
 *                     type: array
 *                     items:
 *                       type: string
 *                   bookingsPerMonth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Business details saved
 *       200:
 *         description: Business details updated
 *       400:
 *         description: Missing data
 *       500:
 *         description: Server error
 */


// POST or PUT route to save or update business details
router.post("/business-details", async (req, res) => {
  const { id, businessDetails2 } = req.body;
  
  console.log("Backend received request with data:", { id, businessDetails2 });

  if (!businessDetails2) {
    console.log("Error: No business details provided");
    return res
      .status(400)
      .json({ message: "Please provide business details." });
  }
  const {
    businessName,
    category,
    gstin,
    panNo,
    years,
    businessAddress,
    teamsize,
    annualrevenue,
    pinCode,
    cities,
    bookingsPerMonth,
  } = businessDetails2;

  try {
    const existingDetails = await BusinessDetailsModel.findOne({ id });

    if (existingDetails) {      await BusinessDetailsModel.findOneAndUpdate(
        { id },
        {
          businessName,
          category,
          gstin,
          panNo,
          teamsize,
          businessAddress,
          pinCode,
          cities,
          years,
          annualrevenue,
          bookingsPerMonth,
        },
        { new: true },
      );
      return res
        .status(200)
        .json({ message: "Business details updated successfully." });
    } else {      const newBusinessDetails = new BusinessDetailsModel({
        id,
        businessName,
        category,
        gstin,
        panNo,
        teamsize,
        businessAddress,
        pinCode,
        cities,
        years,
        annualrevenue,
        bookingsPerMonth,
      });

      await newBusinessDetails.save();
      return res
        .status(201)
        .json({ message: "Business details saved successfully." });
    }  } catch (error) {
    console.error("Error in business-details endpoint:", error);
    res
      .status(500)
      .json({ message: "Failed to save or update business details.", error: error.message });
  }
});
/**
 * @swagger
 * /api/business-details/{id}:
 *   get:
 *     summary: Get business details by user ID
 *     tags: [BusinessDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Business details found
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */

// Route to fetch business details by id
router.get("/business-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const businessDetails = await BusinessDetailsModel.findOne({ id });
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

router.use("/decorator-details", decoratorRoutes);
router.use("/gifts-details", giftRoutes);
router.use("/venue-provider-details", venueRoutes);
router.use("/pav-details", pavRoutes);
router.use("/prop-rental-details", propRentalRoutes);
router.use("/invitation-details", invitationRoutes);
router.use("/makeup-artist-details", makeupArtistRoutes);
router.use("/dj-artist-details", djArtistRoutes);

/** CATERING DETAILS ROUTES **/

/**
 * @swagger
 * /api/catering-details:
 *   post:
 *     summary: Save or update catering details
 *     tags: [CateringDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, cateringData]
 *             properties:
 *               id: { type: string }
 *               cateringData:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201: { description: Catering details saved }
 *       200: { description: Catering details updated }
 *       400: { description: Missing ID or data }
 *       500: { description: Server error }
 */

// POST or PUT route to save or update catering details
router.post("/catering-details", async (req, res) => {
  const { id, cateringData } = req.body; // Extracting cateringData from the nested structure

  console.log("id", id);

  // Validate id and cateringData
  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!cateringData || Object.keys(cateringData).length === 0) {
    return res.status(400).json({ message: "Catering details are required." });
  }

  try {
    // Check if the catering details already exist
    const existingDetails = await CateringModel.findOne({ id });

    if (existingDetails) {
      // Update existing catering details
      const updatedDetails = await CateringModel.findOneAndUpdate(
        { id },
        { $set: cateringData }, // Explicitly set the fields to update
        { new: true, upsert: false }, // No need for upsert here since it already exists
      );
      return res.status(200).json({
        message: "Catering details updated successfully.",
        data: updatedDetails,
      });
    } else {
      // Create new catering details
      const newCateringDetails = new CateringModel({ id, ...cateringData });
      await newCateringDetails.save();
      return res.status(201).json({
        message: "Catering details saved successfully.",
        data: newCateringDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating catering details:", error);
    res.status(500).json({
      message: "Failed to save or update catering details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/catering-details/{id}:
 *   get:
 *     summary: Get catering details by user ID
 *     tags: [CateringDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     responses:
 *       200: { description: Catering details found }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */

// GET route to retrieve catering details by user ID
router.get("/catering-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const cateringDetails = await CateringModel.findOne({ id: id.trim() });

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

/**
 * @swagger
 * /api/catering-details/{id}:
 *   delete:
 *     summary: Delete catering details by user ID
 *     tags: [CateringDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     responses:
 *       200: { description: Catering details deleted }
 *       400: { description: Missing ID }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */

// DELETE route to remove catering details by user ID
router.delete("/catering-details/:id", async (req, res) => {
  const { id } = req.params;

  console.log("Deleting catering details for ID:", id);

  // Corrected validation: Check if 'id' is missing or empty after trimming
  if (!id || id.trim() === '') {
    return res.status(400).json({ message: "User ID is required for deletion." });
  }

  try {
    const deletedDetails = await CateringModel.findOneAndDelete({ id: id }); 

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

// Export the router
export { router as businessDetailsRoutes };
