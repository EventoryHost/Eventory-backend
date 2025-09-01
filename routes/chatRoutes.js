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
  getChatsWithUnreadCounts, // Import the new function
  markChatAsRead,
} from "../controllers/chatController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat-related APIs
 */

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get all messages by chat ID
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 */
router.get("/:chatId/messages", getMessagesByChatId);

/**
 * @swagger
 * /api/chats/upload-media:
 *   post:
 *     summary: Upload media to a chat
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 */
router.post("/upload-media", upload("chat").single("file"), uploadChatMedia);

/**
 * @swagger
 * /api/chats/{chatId}/search:
 *   get:
 *     summary: Search messages within a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/:chatId/search", searchMessages);

/**
 * @swagger
 * /api/chats/{chatId}/search/{qId}:
 *   get:
 *     summary: Get message context by query ID
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Context retrieved
 */
router.get("/:chatId/search/:qId", getMessageContext);

/**
 * @swagger
 * /api/chats/{chatId}/pinned-messages:
 *   get:
 *     summary: Get pinned messages
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pinned messages retrieved
 */
router.get("/:chatId/pinned-messages", getPinnedMessages);

/**
 * @swagger
 * /api/chats/chat/{chatId}/pin/{messageId}:
 *   post:
 *     summary: Pin a message in a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message pinned
 */
router.post("/chat/:chatId/pin/:messageId", pinMessageInChat);

/**
 * @swagger
 * /api/chats/chat/{chatId}/unpin/{messageId}:
 *   post:
 *     summary: Unpin a message from a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message unpinned
 */
router.post("/chat/:chatId/unpin/:messageId", unpinMessageInChat);

/**
 * @swagger
 * /api/chats/chat/{chatId}/block:
 *   post:
 *     summary: Block a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat blocked
 */
router.post("/chat/:chatId/block", blockChat);

/**
 * @swagger
 * /api/chats/chat/{chatId}/unblock:
 *   post:
 *     summary: Unblock a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat unblocked
 */
router.post("/chat/:chatId/unblock", unblockChat);

/**
 * @swagger
 * /api/chats/chat/{chatId}/pinned:
 *   get:
 *     summary: Get pinned messages from chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pinned messages retrieved
 */
router.get("/chat/:chatId/pinned", getPinnedMessages);

/**
 * @swagger
 * /api/chats/blocked:
 *   get:
 *     summary: Get all blocked chats
 *     tags: [Chats]
 *     responses:
 *       200:
 *         description: Blocked chats retrieved
 */
router.get("/blocked", getBlockedChats);
/**
 * @swagger
 * /unread/{userType}/{userId}:
 * get:
 * summary: Get chats with unread message counts
 * description: Retrieves all chats for a given user and returns the unread message counts.
 * tags:
 * - Chats
 * parameters:
 * - in: path
 * name: userType
 * required: true
 * schema:
 * type: string
 * enum: [cus, ven, rm]
 * description: Type of the user (cus, ven, or rm).
 * - in: path
 * name: userId
 * required: true
 * schema:
 * type: string
 * description: Unique ID of the user.
 * responses:
 * 200:
 * description: Successfully retrieved unread message counts.
 * content:
 * application/json:
 * schema:
 * type: object
 * example:
 * chats:
 * - chatId: "abc123"
 * unreadCount: 5
 * 400:
 * description: Invalid parameters provided.
 * 500:
 * description: Internal server error.
 */

router.get("/unread/:userType/:userId", getChatsWithUnreadCounts);
/**
 * @swagger
 * /{chatId}/mark-read/{userType}:
 * post:
 * summary: Mark chat messages as read
 * description: Marks all messages in a chat as read for a specific user type.
 * tags:
 * - Chats
 * parameters:
 * - in: path
 * name: chatId
 * required: true
 * schema:
 * type: string
 * description: ID of the chat.
 * - in: path
 * name: userType
 * required: true
 * schema:
 * type: string
 * enum: [cus, ven, rm]
 * description: Type of the user marking messages as read.
 * responses:
 * 200:
 * description: Successfully marked messages as read.
 * content:
 * application/json:
 * schema:
 * type: object
 * example:
 * success: true
 * message: "Messages marked as read"
 * 400:
 * description: Invalid parameters provided.
 * 404:
 * description: Chat not found.
 * 500:
 * description: Internal server error.
 */

router.post("/:chatId/mark-read/:userType", markChatAsRead);

export default router;
