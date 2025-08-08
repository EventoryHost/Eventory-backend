import express from "express";
import {
  createReview,
  getReviewsByVendor,
  updateReview,
  deleteReview,
  getReviewCount,
} from "../controllers/reviewController.js";

const reviewRoutes = express.Router();

/**
 * @swagger
 * /api/review:
 *   post:
 *     summary: Create a new review
 *     tags: [Review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request
 */
reviewRoutes.post("/", createReview);

/**
 * @swagger
 * /api/review:
 *   get:
 *     summary: Get all reviews for a vendor
 *     tags: [Review]
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the vendor
 *     responses:
 *       200:
 *         description: List of reviews
 *       400:
 *         description: Vendor ID missing or invalid
 */
reviewRoutes.get("/", getReviewsByVendor);

/**
 * @swagger
 * /api/review/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */
reviewRoutes.put("/:reviewId", updateReview);

/**
 * @swagger
 * /api/review/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
reviewRoutes.delete("/:reviewId", deleteReview);

/**
 * @swagger
 * /api/review/count/{serviceId}:
 *   get:
 *     summary: Get the number of reviews for a service
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service
 *     responses:
 *       200:
 *         description: Review count retrieved successfully
 *       404:
 *         description: Service not found
 */
reviewRoutes.get("/count/:serviceId", getReviewCount);

export default reviewRoutes;
