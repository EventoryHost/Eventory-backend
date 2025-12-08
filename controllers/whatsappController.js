import axios from "axios";
import WhatsappMessage from "../models/whatsappMessage.js";
import dotenv from "dotenv";

dotenv.config();

const WHATSAPP_TOKEN = process.env.WA_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "EVENTORY1234";

// 1. Webhook Verification
export const verifyWhatsappWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

// 2. Handle Incoming Messages
export const handleIncomingWhatsappMessage = async (req, res) => {
  try {
    const body = req.body;

    // Check if this is an event from a WhatsApp API
    if (body.object === "whatsapp_business_account") {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const senderNumber = message.from;
        const waId = message.id;
        const raw = message;

        let text = "";
        if (message.type === "text") {
          text = message.text.body;
        } else {
          text = `[${message.type.toUpperCase()}]`; // Handle other types gracefully
        }

        console.log(`Received WhatsApp message from ${senderNumber}: ${text}`);

        // Save to MongoDB
        await WhatsappMessage.create({
          waId,
          text,
          direction: "incoming",
          senderNumber,
          receiverNumber: PHONE_NUMBER_ID, // Assuming the receiver is our business number ID or we can extract from metadata if needed
          raw,
        });
      }
      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error handling incoming WhatsApp message:", error);
    return res.sendStatus(500);
  }
};

// 3. Send Message
export const sendWhatsappMessage = async (req, res) => {
  const { to, text } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: "Missing 'to' or 'text' field" });
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      text: { body: text },
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    const responseData = response.data;

    // Save outgoing message to DB
    // Response usually contains messages: [{ id: '...' }]
    const waId = responseData.messages?.[0]?.id || `outgoing_${Date.now()}`;

    await WhatsappMessage.create({
      waId,
      text,
      direction: "outgoing",
      senderNumber: PHONE_NUMBER_ID, // Us
      receiverNumber: to,
      raw: responseData,
    });

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to send message",
      details: error.response?.data || error.message,
    });
  }
};

// 4. Fetch Messages
export const getWhatsappMessages = async (req, res) => {
  try {
    const messages = await WhatsappMessage.find().sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};
