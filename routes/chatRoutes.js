import express from "express";
import { getMessagesByChatId, uploadChatMedia } from "../controllers/chatController.js";
import upload from "../middlewares/uploads.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId/messages", getMessagesByChatId);

router.post(
  "/upload-media/:id", // :id = userId or chatId as per your logic
  upload("Chat_Media").single("media"),
  uploadChatMedia
);
export default router;