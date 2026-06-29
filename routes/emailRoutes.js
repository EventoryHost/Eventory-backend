import { Router } from "express";
import { sendEmail } from "../controllers/emailRoutesController.js";

const router = Router();

/**
 * @swagger
 * /send-email:
 *   post:
 *     summary: Send an email
 *     tags: [Email]
 *     description: Sends an email using configured SMTP service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 example: "user@example.com"
 *               subject:
 *                 type: string
 *                 example: "Welcome to our service"
 *               text:
 *                 type: string
 *                 example: "Hello, this is a plain text body"
 *               html:
 *                 type: string
 *                 example: "<b>Hello, this is an HTML body</b>"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to send email
 */
router.post("/send-email", sendEmail);

export default router;
