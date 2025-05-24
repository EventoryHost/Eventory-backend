import express from "express";
import { getMessagesByChatId } from "../controllers/chatController.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId/messages", getMessagesByChatId);

export default router;