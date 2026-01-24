import { Router } from "express";
import { getFeaturedVendors } from "../controllers/featuredVendorsController.js";

const router = Router();

/**
 * @swagger
 * /api/featured-vendors:
 *   get:
 *     summary: Get a list of featured vendors
 *     tags:
 *       - Vendors
 *     responses:
 *       200:
 *         description: List of featured vendors retrieved successfully
 *       500:
 *         description: Server error while fetching featured vendors
 */
router.get("/", getFeaturedVendors);

export default router;
