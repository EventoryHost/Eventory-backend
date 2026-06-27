import { Router } from "express";
import {
  sendResponseOnIntroMessage,
  sendPromotionTemplate,
  handlePromoResponse,
  getVendors,
  verifyWebhook,
  verifyPromoResponseWebhook,
} from "../controllers/waController.js";
import {
  verifyWhatsappWebhook,
  handleIncomingWhatsappMessage,
} from "../controllers/whatsappController.js";
import { triggerInteraktSlackIntegration } from "../utils/slackLists.js";

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
waRoutes.get("/", verifyWebhook);

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
waRoutes.get("/promo-response", verifyPromoResponseWebhook);

/**
 * @swagger
 * /webhook/whatsapp:
 *   get:
 *     summary: Verify WhatsApp Webhook
 *     tags: [WhatsApp Integration]
 */
waRoutes.get("/whatsapp", verifyWhatsappWebhook);

/**
 * @swagger
 * /webhook/whatsapp:
 *   post:
 *     summary: Receive WhatsApp Messages
 *     tags: [WhatsApp Integration]
 */
waRoutes.post("/whatsapp", handleIncomingWhatsappMessage);

/**
 * @swagger
 * /webhook/interakt-slack:
 *   post:
 *     summary: Receive lead payload from Interakt and push to Slack List & Webhook
 *     tags: [WhatsApp Integration]
 */
waRoutes.post("/interakt-slack", async (req, res) => {
  console.log("========== INTERAKT WEBHOOK ==========");
  console.log(JSON.stringify(req.body, null, 2));
  console.log(
    `Received ${Object.keys(req.body || {}).length} fields from Interakt`,
  );
  console.log("======================================");

  const payload = req.body || {};
  if (
    payload.phone_number === undefined ||
    payload.phone_number === null ||
    String(payload.phone_number).trim() === ""
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: phone_number",
    });
  }

  try {
    const result = await triggerInteraktSlackIntegration(req.body);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Lead processed and Slack ticket created successfully.",
        ticket_id: result.ticket_id,
        mock: result.mock,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to process lead.",
      });
    }
  } catch (error) {
    console.error("Error handling interakt-slack webhook:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default waRoutes;
