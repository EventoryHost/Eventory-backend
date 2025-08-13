import "dotenv/config";
import express from "express";
const verificationRoutes = express.Router();

import {
  verifyGSTIN,
  verifyPAN,
  verifyBankDetails,
} from "../controllers/verificationController.js";

/**
 * @swagger
 * tags:
 *   name: Verifications
 *   description: APIs to verify GSTIN, PAN, and bank details
 */

/**
 * @swagger
 * /api/verification/GSTIN/{gstIn}:
 *   get:
 *     summary: Verify GSTIN number
 *     tags: [Verifications]
 *     parameters:
 *       - in: path
 *         name: gstIn
 *         required: true
 *         schema:
 *           type: string
 *         description: GSTIN number to verify
 *     responses:
 *       200:
 *         description: GSTIN verified successfully
 *       400:
 *         description: Invalid GSTIN format
 *       404:
 *         description: GSTIN not found
 *       500:
 *         description: Server error
 */
verificationRoutes.get("/GSTIN/:gstIn", verifyGSTIN);

/**
 * @swagger
 * /api/verification/pan-gstin/{panNo}:
 *   get:
 *     summary: Verify PAN number linked with GSTIN
 *     tags: [Verifications]
 *     parameters:
 *       - in: path
 *         name: panNo
 *         required: true
 *         schema:
 *           type: string
 *         description: PAN number to verify
 *     responses:
 *       200:
 *         description: PAN verified successfully
 *       400:
 *         description: Invalid PAN number
 *       404:
 *         description: PAN not found
 *       500:
 *         description: Server error
 */
verificationRoutes.get("/pan-gstin/:panNo", verifyPAN);

/**
 * @swagger
 * /api/verification/bank:
 *   post:
 *     summary: Verify bank account details
 *     tags: [Verifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_number
 *               - ifsc
 *             properties:
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *               ifsc:
 *                 type: string
 *                 example: "SBIN0001234"
 *     responses:
 *       200:
 *         description: Bank details verified successfully
 *       400:
 *         description: Invalid bank details
 *       500:
 *         description: Server error
 */
verificationRoutes.post("/bank", verifyBankDetails);

export default verificationRoutes;
