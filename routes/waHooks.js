import { Router } from "express";
import {
  sendResponseOnIntroMessage,
  sendPromotionTemplate,
  handlePromoResponse,
  getVendors,
} from "../controllers/waController.js";

const waRoutes = Router();

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Respond to an intro WhatsApp message (Webhook receiver)
 *     tags: [WhatsApp]
 *     requestBody:
 *       description: Webhook message payload from WhatsApp
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Message processed successfully
 *       400:
 *         description: Bad request
 */
waRoutes.post("/", sendResponseOnIntroMessage);

/**
 * @swagger
 * /webhook:
 *   get:
 *     summary: WhatsApp Webhook verification
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Verification failed
 */
waRoutes.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const myToken = "EVENTORY1234";

  if (mode && token) {
    if (mode === "subscribe" && token === myToken) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

/**
 * @swagger
 * /webhook/send-promotions:
 *   post:
 *     summary: Send promotional WhatsApp message to vendors
 *     tags: [WhatsApp]
 *     requestBody:
 *       description: Details for the promotional message
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               template:
 *                 type: string
 *     responses:
 *       200:
 *         description: Promotions sent successfully
 *       400:
 *         description: Invalid input
 */
waRoutes.post("/send-promotions", sendPromotionTemplate);

/**
 * @swagger
 * /webhook/vendors:
 *   get:
 *     summary: Get list of vendors eligible for WhatsApp promotions
 *     tags: [WhatsApp]
 *     responses:
 *       200:
 *         description: List of vendors
 */
waRoutes.get("/vendors", getVendors);

/**
 * @swagger
 * /webhook/promo-response:
 *   post:
 *     summary: Handle vendor response to WhatsApp promotion
 *     tags: [WhatsApp]
 *     requestBody:
 *       description: Vendor response data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Response processed
 */
waRoutes.post("/promo-response", handlePromoResponse);

/**
 * @swagger
 * /webhook/promo-response:
 *   get:
 *     summary: Webhook verification for promo-response
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Verification failed
 */
waRoutes.get("/promo-response", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const myToken = "EVENTORY1234";

  if (mode && token) {
    if (mode === "subscribe" && token === myToken) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

export default waRoutes;
