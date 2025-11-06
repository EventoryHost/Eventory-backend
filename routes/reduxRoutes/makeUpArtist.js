import express from "express";
const router = express.Router();
import MakeupArtistModel from "../../models/reduxStores/makeUpArtist.js";

/**
 * @swagger
 * tags:
 *   name: MakeupArtistDetails
 *   description: Manage makeup artist service details
 */

/**
 * @swagger
 * /api/makeup-artist-details:
 *   post:
 *     summary: Save or update makeup artist details
 *     tags: [MakeupArtistDetails]
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
 *                   name: "Priya Sharma"
 *                   experience: "5 years"
 *                   specialty: "Bridal Makeup"
 *                   price: 12000
 *     responses:
 *       201:
 *         description: Makeup artist details saved successfully
 *       200:
 *         description: Makeup artist details updated successfully
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
    return res
      .status(400)
      .json({ message: "Makeup artist details are required." });
  }

  try {
    // Process the data to ensure photos and videos are in the correct format
    const processedData = { ...data };
    
    // Handle photos
    if (processedData.photos) {
      if (typeof processedData.photos === 'string') {
        processedData.photos = [{ original: processedData.photos, preview: processedData.photos }];
      } else if (Array.isArray(processedData.photos)) {
        processedData.photos = processedData.photos.map(photo => {
          if (typeof photo === 'string') {
            return { original: photo, preview: photo };
          }
          return photo;
        });
      }
    }
    
    // Handle videos
    if (processedData.videos) {
      if (typeof processedData.videos === 'string') {
        try {
          const arr = JSON.parse(processedData.videos);
          processedData.videos = Array.isArray(arr) ? arr.filter(v => typeof v === 'string' && v.length > 0) : [];
        } catch (e) {
          processedData.videos = [processedData.videos];
        }
      } else if (Array.isArray(processedData.videos)) {
        processedData.videos = processedData.videos.filter(v => typeof v === 'string' && v.length > 0);
      }
    }
    

    const existingDetails = await MakeupArtistModel.findOne({ id });

    if (existingDetails) {
      const updatedDetails = await MakeupArtistModel.findOneAndUpdate(
        { id },
        { $set: processedData },
        { new: true, upsert: false },
      );
      return res.status(200).json({
        message: "Makeup artist details updated successfully.",
        data: updatedDetails,
      });
    } else {
      const newMakeupArtistDetails = new MakeupArtistModel({
        id,
        ...processedData,
      });
      await newMakeupArtistDetails.save();
      return res.status(201).json({
        message: "Makeup artist details saved successfully.",
        data: newMakeupArtistDetails,
      });
    }
  } catch (error) {
    console.error("Error saving/updating makeup artist details:", error);
    res.status(500).json({
      message: "Failed to save or update makeup artist details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/makeup-artist-details/{id}:
 *   get:
 *     summary: Get makeup artist details by user ID
 *     tags: [MakeupArtistDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Makeup artist details retrieved successfully
 *       404:
 *         description: Makeup artist details not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const makeupArtistDetails = await MakeupArtistModel.findOne({ id });

    if (!makeupArtistDetails) {
      return res
        .status(404)
        .json({ message: "Makeup artist details not found." });
    }

    res.status(200).json(makeupArtistDetails);
  } catch (error) {
    console.error("Error retrieving makeup artist details:", error);
    res.status(500).json({
      message: "Failed to retrieve makeup artist details.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/makeup-artist-details/{id}:
 *   delete:
 *     summary: Delete makeup artist details by user ID
 *     tags: [MakeupArtistDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Makeup artist details deleted successfully
 *       404:
 *         description: Makeup artist details not found for deletion
 *       400:
 *         description: Missing user ID
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required for deletion." });
  }

  try {
    const deletedDetails = await MakeupArtistModel.findOneAndDelete({ id });

    if (!deletedDetails) {
      return res
        .status(404)
        .json({ message: "Make-Up details not found for deletion." });
    }

    res.status(200).json({ message: "Make-Up details deleted successfully." });
  } catch (error) {
    console.error("Error deleting Make-Up details:", error);
    res.status(500).json({
      message: "Failed to delete Make-Up details.",
      error: error.message,
    });
  }
});

export { router as makeupArtistRoutes };
