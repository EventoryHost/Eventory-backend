import express from "express";
const router = express.Router();
import PropRentalModel from "../../models/reduxStores/prop-rental.js";

/**
 * @swagger
 * tags:
 *   name: PropRentalDetails
 *   description: Manage Prop Rental provider details
 */

/**
 * @swagger
 * /api/prop-rental-details:
 *   post:
 *     summary: Save or update Prop Rental details
 *     tags: [PropRentalDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, propRentalData]
 *             properties:
 *               id:
 *                 type: string
 *                 description: User ID
 *               propRentalData:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   itemName: "Wedding Stage Setup"
 *                   price: 15000
 *                   availability: true
 *                   category: "Decor Props"
 *     responses:
 *       201:
 *         description: Prop rental details saved successfully
 *       200:
 *         description: Prop rental details updated successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  const { id, propRentalData } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!propRentalData || Object.keys(propRentalData).length === 0) {
    return res
      .status(400)
      .json({ message: "Prop rental details are required." });
  }

  try {
    const existingDetails = await PropRentalModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await PropRentalModel.findOneAndUpdate(
        { id },
        { $set: propRentalData },
        { new: true, upsert: false },
      );
      return res.status(200).json({
        message: "Prop rental details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newPropRentalDetails = new PropRentalModel({
        id,
        ...propRentalData,
      });
      await newPropRentalDetails.save();
      return res.status(201).json({
        message: "Prop rental details saved successfully.",
        data: newPropRentalDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating prop rental details:", error);
    res.status(500).json({
      message: "Failed to save or update prop rental details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/prop-rental-details/{id}:
 *   get:
 *     summary: Get Prop Rental details by user ID
 *     tags: [PropRentalDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Prop rental details retrieved successfully
 *       404:
 *         description: Prop rental details not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const propRentalDetails = await PropRentalModel.findOne({ id });

    if (!propRentalDetails) {
      return res
        .status(404)
        .json({ message: "Prop rental details not found." });
    }

    res.status(200).json(propRentalDetails);
  } catch (error) {
    console.error("Error retrieving prop rental details:", error);
    res.status(500).json({
      message: "Failed to retrieve prop rental details.",
      error: error.message,
    });
  }
});

export { router as propRentalRoutes };
