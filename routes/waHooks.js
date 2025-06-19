import { Router } from "express";
import {
  sendResponseOnIntroMessage,
  sendPromotionTemplate,
  handlePromoResponse,
  getVendors,
} from "../controllers/waController.js";

const waRoutes = Router();

waRoutes.post("/", sendResponseOnIntroMessage);
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

waRoutes.post("/send-promotions", sendPromotionTemplate);
waRoutes.get("/vendors", getVendors);

waRoutes.post("/promo-response", handlePromoResponse);
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
