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
import {
  getCustomerById,
  getCustomer,
  updateCustomer,
  addFavourite,
  removeFavourite,
  getFavoriteServiceIds,
  getBooking
} from "../controllers2/customerController.js";

const router = express.Router();

/**
 * @swagger
 * /api/customer/get-customer/{mobile}:
 *   get:
 *     summary: Get customer by phone number
 *     tags: [Customer]
 */
router.get("/get-customer/:mobile", getCustomer);

/**
 * @swagger
 * /api/customer/update-customer/{id}:
 *   patch:
 *     summary: Update customer details
 *     tags: [Customer]
 */
router.patch("/update-customer/:id", updateCustomer);

/**
 * @swagger
 * /api/customer/add-fav/{cusId}/{serviceId}:
 *   post:
 *     summary: Add a vendor to customer's favorites
 *     tags: [Customer]
 */
router.post("/add-fav/:customer_id/:service_id", addFavourite);

/**
 * @swagger
 * /api/customer/get-fav-id/{cusId}:
 *   get:
 *     summary: Get favorite service IDs for a customer
 *     tags: [Customer]
 */
router.get("/get-fav-id/:customer_id", getFavoriteServiceIds);

/**
 * @swagger
 * /api/customer/get-booking/{cusId}/{serId}:
 *   get:
 *     summary: Get bookings for a customer and service
 *     tags: [Customer]
 */
router.get("/get-booking/:customer_id/:service_id", getBooking);

/**
 * @swagger
 * /api/customer/remove-fav/{cusId}/{serviceId}:
 *   delete:
 *     summary: Remove vendor from customer's favorites
 *     tags: [Customer]
 */
router.delete("/remove-fav/:customer_id/:service_id", removeFavourite);

/**
 * @swagger
 * /api/customer/{chatId}/messages:
 *   get:
 *     summary: Get messages by chat ID
 *     tags: [Chat]
 */
router.get("/:chatId/messages", getMessagesByChatId);

/**
 * @swagger
 * /api/customer/upload-media:
 *   post:
 *     summary: Upload media for chat
 *     tags: [Chat]
 */
router.post("/upload-media", upload("chat").single("file"), uploadChatMedia);

/**
 * @swagger
 * /api/customer/{chatId}/search:
 *   get:
 *     summary: Search messages in a chat
 *     tags: [Chat]
 */
router.get("/:chatId/search", searchMessages);

/**
 * @swagger
 * /api/customer/{chatId}/search/{qId}:
 *   get:
 *     summary: Get message context
 *     tags: [Chat]
 */
router.get("/:chatId/search/:qId", getMessageContext);

/**
 * @swagger
 * /api/customer/chat/{chatId}/pin/{messageId}:
 *   post:
 *     summary: Pin message in chat
 *     tags: [Chat]
 */
router.post("/chat/:chatId/pin/:messageId", pinMessageInChat);

/**
 * @swagger
 * /api/customer/chat/{chatId}/unpin/{messageId}:
 *   post:
 *     summary: Unpin message in chat
 *     tags: [Chat]
 */
router.post("/chat/:chatId/unpin/:messageId", unpinMessageInChat);

/**
 * @swagger
 * /api/customer/chat/{chatId}/block:
 *   post:
 *     summary: Block a chat
 *     tags: [Chat]
 */
router.post("/chat/:chatId/block", blockChat);

/**
 * @swagger
 * /api/customer/chat/{chatId}/unblock:
 *   post:
 *     summary: Unblock a chat
 *     tags: [Chat]
 */
router.post("/chat/:chatId/unblock", unblockChat);

/**
 * @swagger
 * /api/customer/chat/{chatId}/pinned:
 *   get:
 *     summary: Get pinned messages in chat
 *     tags: [Chat]
 */
router.get("/chat/:chatId/pinned", getPinnedMessages);

/**
 * @swagger
 * /api/customer/blocked:
 *   get:
 *     summary: Get blocked chats
 *     tags: [Chat]
 */
router.get("/blocked", getBlockedChats);

/**
 * @swagger
 * /api/customer/{customerId}/customerNotifications:
 *   get:
 *     summary: Get customer notifications
 *     tags: [Notifications]
 */
router.get("/:customerId/customerNotifications", getCustomerNotifications);

/**
 * @swagger
 * /api/customer/notifications/read/{notificationId}:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 */
router.patch("/notifications/read/:notificationId", markNotificationAsRead);

/**
 * @swagger
 * /api/customer/{customerId}/customerNotifications/read-all:
 *   patch:
 *     summary: Mark all customer notifications as read
 *     tags: [Notifications]
 */
router.patch("/:customerId/customerNotifications/read-all", markAllCustomerNotificationsAsRead);

/**
 * @swagger
 * /api/customer/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customer]
 */
router.get("/:id", getCustomerById);

export default router;
