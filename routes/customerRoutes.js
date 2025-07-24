import express from "express";
import upload from "../middlewares/uploads.js";
import {
  getMessagesByChatId,
  uploadChatMedia,
  searchMessages,
  getMessageContext,
  pinMessageInChat,
  unpinMessageInChat,
  blockChat,
  unblockChat,
  getPinnedMessages,
  getBlockedChats,
  getCustomerNotifications,
  markNotificationAsRead,
  markAllCustomerNotificationsAsRead,
} from "../controllers/chatController.js";
import { getCustomerById } from "../controllers/customerController.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId/messages", getMessagesByChatId);

// Upload media files for chat using the existing upload middleware
router.post("/upload-media", upload("chat").single("file"), uploadChatMedia);

router.get("/:chatId/search", searchMessages);
router.get("/:chatId/search/:qId", getMessageContext);

//RM FUNCTIONS
router.post("/chat/:chatId/pin/:messageId", pinMessageInChat);
router.post("/chat/:chatId/unpin/:messageId", unpinMessageInChat);

router.post("/chat/:chatId/block", blockChat);
router.post("/chat/:chatId/unblock", unblockChat);

router.get("/chat/:chatId/pinned", getPinnedMessages);

// router for blocked chats
router.get("/blocked", getBlockedChats);
router.get("/:customerId/customerNotifications" , getCustomerNotifications);
router.patch("/notifications/read/:notificationId", markNotificationAsRead);

router.patch("/:customerId/customerNotifications/read-all", markAllCustomerNotificationsAsRead);

router.get("/:id", getCustomerById);


export default router;
