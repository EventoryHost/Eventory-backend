import express from "express";
import { authenticateSalesUser } from "../controllers2/salesRoutesController.js";

const router = express.Router();

/**
 * @swagger
 * /api/salesauth:
 *   post:
 *     summary: Authenticate sales user
 *     tags:
 *       - Sales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sales user authenticated successfully
 *       400:
 *         description: Username and password are required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/salesauth", authenticateSalesUser);

export default router;
