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
  editMessage
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


router.put("/chat/edit-message", editMessage);

export default router;
