import { Router } from "express";
import { sendResponseOnIntroMessage } from "../controllers/waController.js";

const waRoutes = Router();

waRoutes.post("/", sendResponseOnIntroMessage);
waRoutes.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === "hooks") {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

export default waRoutes;
