import { Router } from "express";
import { generateAndStoreAgreement } from "../controllers/agreementController.js";

const router = Router();

/**
 * @swagger
 * /api/agreements/generate/{serviceType}/{vendorId}:
 *   post:
 *     summary: Generate and store a vendor agreement PDF
 *     tags:
 *       - Agreements
 *     parameters:
 *       - in: path
 *         name: serviceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of vendor service (e.g., photographer, DJ)
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the vendor
 *     responses:
 *       200:
 *         description: Agreement generated and stored successfully
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Server error while generating the agreement
 */


// POST endpoint to generate and store agreement PDF
router.post("/generate/:serviceType/:vendorId", generateAndStoreAgreement);

export default router;
