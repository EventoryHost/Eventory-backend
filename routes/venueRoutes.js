import express from "express";
import {
  addReviews,
  getAllVenues,
  getVenueImages,
  getVenueReviews,
  getVenueVideos,
} from "../controllers/products/venueController.js";

const router = express.Router();

/**
 * @swagger
 * /api/venue/venue:
 *   get:
 *     summary: Get images for venues
 *     tags:
 *       - Venues
 *     responses:
 *       200:
 *         description: Venue images fetched successfully
 *       500:
 *         description: Server error while fetching venue images
 */
router.get("/venue", getVenueImages);

/**
 * @swagger
 * /api/venue/allVenues:
 *   get:
 *     summary: Get all venues
 *     tags:
 *       - Venues
 *     responses:
 *       200:
 *         description: List of all venues
 *       500:
 *         description: Server error while fetching venues
 */
router.get("/allVenues", getAllVenues);

/**
 * @swagger
 * /api/venue/review:
 *   get:
 *     summary: Get reviews for venues
 *     tags:
 *       - Venues
 *     responses:
 *       200:
 *         description: Venue reviews fetched successfully
 *       404:
 *         description: No reviews found
 */
router.get("/review", getVenueReviews);

export default router;
