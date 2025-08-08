import express from "express";
const router = express.Router();
import PAVModel from "../../models/reduxStores/pav.js";

/**
 * @swagger
 * tags:
 *   name: PAVDetails
 *   description: Manage PAV (Photography, Audio, Video) provider details
 */

/**
 * @swagger
 * /api/pav-details:
 *   post:
 *     summary: Save or update PAV details
 *     tags: [PAVDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, pavData]
 *             properties:
 *               id:
 *                 type: string
 *                 description: User ID
 *               pavData:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   serviceName: "Wedding Photography"
 *                   location: "Mumbai"
 *                   price: 45000
 *                   availability: true
 *     responses:
 *       201:
 *         description: PAV details saved successfully
 *       200:
 *         description: PAV details updated successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  const { id, pavData } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!pavData || Object.keys(pavData).length === 0) {
    return res.status(400).json({ message: "PAV details are required." });
  }

  try {
    const existingDetails = await PAVModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await PAVModel.findOneAndUpdate(
        { id },
        { $set: pavData },
        { new: true, upsert: false },
      );
      return res.status(200).json({
        message: "PAV details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newPAVDetails = new PAVModel({ id, ...pavData });
      await newPAVDetails.save();
      return res.status(201).json({
        message: "PAV details saved successfully.",
        data: newPAVDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating PAV details:", error);
    res.status(500).json({
      message: "Failed to save or update PAV details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/pav-details/{id}:
 *   get:
 *     summary: Get PAV details by user ID
 *     tags: [PAVDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: PAV details retrieved successfully
 *       404:
 *         description: PAV details not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pavDetails = await PAVModel.findOne({ id });

    if (!pavDetails) {
      return res.status(404).json({ message: "PAV details not found." });
    }

    res.status(200).json(pavDetails);
  } catch (error) {
    console.error("Error retrieving PAV details:", error);
    res.status(500).json({
      message: "Failed to retrieve PAV details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/pav-details/{id}:
 *   delete:
 *     summary: Delete PAV details by user ID
 *     tags: [PAVDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: PAV details deleted successfully
 *       404:
 *         description: PAV details not found for deletion
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Deleting PAV details for ID:", id);

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required for deletion." });
  }

  try {
    const deletedDetails = await PAVModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "PAV details not found for deletion." });
    }

    console.log("✅ Deleted PAV details:", deletedDetails);
    res.status(200).json({ message: "PAV details deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting PAV details:", error);
    res.status(500).json({
      message: "Failed to delete PAV details.",
      error: error.message,
    });
  }
});

export { router as pavRoutes };
