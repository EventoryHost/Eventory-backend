import express from "express";
import { getMessagesByChatId } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:chatId", getMessagesByChatId);

export default router;