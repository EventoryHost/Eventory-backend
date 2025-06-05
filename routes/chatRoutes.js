import express from "express";
import upload from "../middlewares/uploads.js";
import { getMessagesByChatId, uploadChatMedia, searchMessages, getMessageContext, pinMessageInChat, unpinMessageInChat, blockChat, unblockChat, getPinnedMessages } from "../controllers/chatController.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId/messages", getMessagesByChatId);

// Upload media files for chat using the existing upload middleware
router.post("/upload-media", upload("chat").single("file"), uploadChatMedia);

router.get('/:chatId/search', searchMessages);
router.get('/:chatId/search/:qId', getMessageContext);

// Get pinned messages for a chat
router.get("/:chatId/pinned-messages", getPinnedMessages);


//RM FUNCTIONS
router.post("/chat/:chatId/pin/:messageId", pinMessageInChat);
router.post("/chat/:chatId/unpin/:messageId", unpinMessageInChat);

router.post("/chat/:chatId/block", blockChat);
router.post("/chat/:chatId/unblock", unblockChat);

export default router;