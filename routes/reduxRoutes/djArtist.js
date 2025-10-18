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
    // Process photos and videos to ensure they have the correct structure
    const processedData = { ...data };

    // Handle photos conversion
    if (processedData.photos) {
      if (typeof processedData.photos === 'string') {
        try {
          processedData.photos = JSON.parse(processedData.photos);
        } catch (e) {
          // If it's not valid JSON, treat it as a single URL string
          processedData.photos = [{ original: processedData.photos, preview: processedData.photos }];
        }
      }

      // Ensure each photo is in the correct format
      if (Array.isArray(processedData.photos)) {
        processedData.photos = processedData.photos.map(photo => {
          if (typeof photo === 'string') {
            return { original: photo, preview: photo };
          } else if (typeof photo === 'object' && photo.original) {
            return {
              original: photo.original,
              preview: photo.preview || photo.original
            };
          }
          return photo;
        });
      }
    }

    // Handle videos conversion
    if (processedData.videos) {
      if (typeof processedData.videos === 'string') {
        try {
          const arr = JSON.parse(processedData.videos);
          processedData.videos = Array.isArray(arr) ? arr.filter(v => typeof v === 'string' && v.length > 0) : [];
        } catch (e) {
          // If not valid JSON, treat as single URL string
          processedData.videos = [processedData.videos];
        }
      } else if (Array.isArray(processedData.videos)) {
        processedData.videos = processedData.videos.filter(v => typeof v === 'string' && v.length > 0);
      }
    }

    const updatedDetails = await DjArtistModel.findOneAndUpdate(
      { id },
      { $set: processedData },
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
