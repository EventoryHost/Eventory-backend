import { Router } from "express";
import {
  addReviews,
  getService,
  getServiceByServiceId,
  getVendorLimit,
  handleSearch,
  updateScheduleColor
} from "../controllers/servicesController.js";

const serviceRouter = Router();

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
