import { Router } from "express";
import {
  getWhatsappMessages,
  sendWhatsappMessage,
} from "../controllers/whatsappController.js";

const whatsappRoutes = Router();

/**
 * @swagger
 * /whatsapp/messages:
 *   get:
 *     summary: Fetch all stored WhatsApp messages
 *     tags: [WhatsApp Integration]
 *     responses:
 *       200:
 *         description: List of messages
 */
whatsappRoutes.get("/messages", getWhatsappMessages);

/**
 * @swagger
 * /whatsapp/send:
 *   post:
 *     summary: Send a WhatsApp message
 *     tags: [WhatsApp Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
whatsappRoutes.post("/send", sendWhatsappMessage);

export default whatsappRoutes;
