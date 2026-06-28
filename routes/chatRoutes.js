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
  updateChatEmId,
  getChatDetails,
  // editMessage
} from "../controllers/chatController.js";

export default function chatRoutes(io) {
  const router = express.Router();

  // Middleware to attach io to all requests
  router.use((req, res, next) => {
    req.io = io;
    next();
  });
  //1. Get all messages by chat ID
  router.get("/:chatId/messages", getMessagesByChatId);

  //2. Upload media to a chat
  router.post(
    "/upload-media",
    upload("chat").array("files", 10),
    uploadChatMedia,
  );

  //3. Search messages within a chat
  router.get("/:chatId/search", searchMessages);

  //4. Get message context by query ID
  router.get("/:chatId/search/:qId", getMessageContext);

  //5. Pin a message in a chat
  router.post("/chat/:chat_id/pin/:message_id", pinMessageInChat);

  //6. Get pinned messages
  router.get("/:chat_id/pinned-messages", getPinnedMessages);

  //7. Unpin a message from a chat
  router.post("/chat/:chat_id/unpin/:message_id", unpinMessageInChat);

  //8. Block a chat
  router.post("/chat/:chat_id/block", blockChat);

  //9. Unblock a chat
  router.post("/chat/:chat_id/unblock", unblockChat);

  //10. Get pinned messages from chat
  // router.get("/chat/:chatId/pinned", getPinnedMessages);

  //11. Get all blocked chats
  router.get("/blocked", getBlockedChats);

  //12. Update em_id when admin sends first message
  router.patch("/chat/update-em", updateChatEmId);

  //13. Get chat details (em_id, status) by chat_id
  router.get("/:chat_id/details", getChatDetails);

  //13. Edit a message (REST API fallback)
  // router.patch("/message/:message_id/edit", editMessage);

  return router;
}
