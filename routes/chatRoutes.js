import express from "express";
import upload from "../middlewares/uploads.js";
import { getMessagesByChatId, uploadChatMedia, searchMessages, getMessageContext } from "../controllers/chatController.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId/messages", getMessagesByChatId);

// Upload media files for chat using the existing upload middleware
router.post("/upload-media", upload("chat").single("file"), uploadChatMedia);

router.get('/:chatId/search', searchMessages);
router.get('/:chatId/search/:qId', getMessageContext);


export default router;