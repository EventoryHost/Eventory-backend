import express from "express";
const router = express.Router();
import DjArtistModel from "../../models/reduxStores/djArtist.js";

/**
 * @swagger
 * tags:
 *   name: DjArtistDetails
 *   description: Manage DJ artist service details
 */

/**
 * @swagger
 * /api/dj-artist-details:
 *   post:
 *     summary: Save or update DJ artist details
 *     tags: [DjArtistDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, data]
 *             properties:
 *               id:
 *                 type: string
 *                 description: User ID
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   name: "DJ Alex"
 *                   experience: "7 years"
 *                   genre: "Bollywood, EDM"
 *                   price: 15000
 *     responses:
 *       200:
 *         description: DJ artist details saved successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  const { id, data } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ message: "DJ artist details are required." });
  }

  try {
    const updatedDetails = await DjArtistModel.findOneAndUpdate(
      { id },
      { $set: data },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
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

/**
 * @swagger
 * /api/dj-artist-details/{id}:
 *   get:
 *     summary: Get DJ artist details by user ID
 *     tags: [DjArtistDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: DJ artist details retrieved successfully
 *       404:
 *         description: DJ artist details not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const djArtistDetails = await DjArtistModel.findOne({ id });

    if (!djArtistDetails) {
      return res.status(404).json({ message: "DJ artist details not found." });
    }

    res.status(200).json(djArtistDetails);
  } catch (error) {
    console.error("Error finding DJ artist details:", error);
    res.status(500).json({
      message: "Failed to find DJ artist details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/dj-artist-details/{id}:
 *   delete:
 *     summary: Delete DJ artist details by user ID
 *     tags: [DjArtistDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: DJ artist details deleted successfully
 *       404:
 *         description: DJ artist details not found for deletion
 *       400:
 *         description: Missing user ID
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const deletedDetails = await DjArtistModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "DJ artist details not found." });
    }

    res.status(200).json({
      message: "DJ artist details deleted successfully.",
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
