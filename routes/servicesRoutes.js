import { Router } from "express";
import {
  addReviews,
  getAllServices,
  getService,
  getServiceByServiceId,
  getVendorLimit,
  handleSearch,
  updateScheduleColor
} from "../controllers/servicesController.js";

const serviceRouter = Router();

/**
 * @swagger
 * /api/services/all:
 *   get:
 *     summary: Get all services from all categories with advanced filtering, pagination, sorting, and search
 *     tags:
 *       - Services
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, caterer, decorator, venue_provider, photographer_videographer, makeupartist, dj_artist]
 *         description: Optional - Filter by specific category or 'all' to get all services
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across vendor ID, vendor names, mobile numbers, and email addresses
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: vendor_name
 *         description: Field to sort by (e.g., vendor_name, vendor_mobile, created_at)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order - ascending or descending
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return (e.g., vendor_id,vendor_name,vendor_mobile)
 *     responses:
 *       200:
 *         description: Services fetched successfully with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 category:
 *                   type: string
 *                   example: caterer
 *                 count:
 *                   type: number
 *                   example: 150
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                       example: 1
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     total:
 *                       type: number
 *                       example: 150
 *                     totalPages:
 *                       type: number
 *                       example: 8
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid category or parameters
 *       500:
 *         description: Server error
 */
serviceRouter.get("/all", getAllServices);

/**
 * @swagger
 * /api/services/getServices/{vendortype}/{vendorid}:
 *   get:
 *     summary: Get services by vendor type and vendor ID
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: vendortype
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of the vendor (e.g., dj, photographer)
 *       - in: path
 *         name: vendorid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: Services fetched successfully
 *       404:
 *         description: Services not found
 */
serviceRouter.get("/getServices/:vendor_type/:vendor_id", getService);

/**
 * @swagger
 * /api/services/getService/{vendortype}/{vendorid}:
 *   get:
 *     summary: Get vendor service limits
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: vendortype
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of the vendor
 *       - in: path
 *         name: vendorid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: Vendor service limit fetched successfully
 *       404:
 *         description: Vendor not found
 */
serviceRouter.get("/getService/:vendor_type/:vendor_id", getVendorLimit);

/**
 * @swagger
 * /api/services/review:
 *   post:
 *     summary: Add a review for a vendor service
 *     tags:
 *       - Services
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *             required:
 *               - vendorId
 *               - rating
 *               - review
 *     responses:
 *       200:
 *         description: Review added successfully
 *       400:
 *         description: Invalid input
 */
serviceRouter.post("/review", addReviews);

/**
 * @swagger
 * /api/services/search:
 *   get:
 *     summary: Search for services
 *     tags:
 *       - Services
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Search results returned
 *       400:
 *         description: Missing or invalid query
 */
serviceRouter.get("/search", handleSearch);
serviceRouter.get("/get-service/:service_type/:service_id", getServiceByServiceId);

//to be done 
serviceRouter.put("/update-schedule-color/:serviceId/:eventId", updateScheduleColor);
export default serviceRouter;
