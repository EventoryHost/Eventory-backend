import { checkPhoneNumber } from "../middlewares/checkPhoneNumber.js";
import { checkProfanity } from "../middlewares/checkProfanity.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import APIFeatures from "../utils/apiFeatures.js";
import mongoose from "mongoose";
import { checkEmails } from "../middlewares/checkEmails.js";
import customerNotification from "../models/customerNotifications.js";
import { updateEnquiryWithMessage } from "./vendorEnquiryController.js";
import fs from "fs";
import { s3 } from "../config/awsConfig.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getFolderName } from "../middlewares/uploads.js";
import { handleInteractiveMessage } from "../services/interactiveChatService.js";

export const handleSocketConnection = (socket, io) => {
  console.log(`🧠 Socket connected: ${socket.id}`);

  // ------------------- JOIN CHAT -------------------
  socket.on("join_chat", async ({ chat_id, sender, chat_type }) => {
    try {
      if (!chat_type) {
        socket.emit("error", "chat_type is required");
        return;
      }

      const chat = await Chat.findOne({ chat_id, chat_type });
      console.log("🔍 Chat lookup:", chat);

      if (!chat) {
        // Special case: allow joining notification rooms for unread marker support
        if (chat_id.startsWith("notifications-")) {
            socket.join(chat_id);
            socket.emit("joined", `Joined notification room ${chat_id}`);
            console.log(`🔔 Socket ${socket.id} joined notification room ${chat_id}`);
            return;
        }
        socket.emit("error", "Chat room does not exist");
        return;
      }

      // Validate user has permission to join this chat type
      if (chat_type === "vendor-admin" && sender !== "vendor" && sender !== "em") {
        socket.emit("error", "You don't have permission to join this chat");
        return;
      }

      if (chat_type === "customer-admin" && sender !== "customer" && sender !== "em") {
        socket.emit("error", "You don't have permission to join this chat");
        return;
      }

      if (chat_type === "vendor-enquiry" && sender !== "vendor" && sender !== "em") {
        socket.emit("error", "You don't have permission to join this chat");
        return;
      }

      if (chat_type === "anon_customer-admin" && sender !== "anonymous_customer" && sender !== "em") {
        socket.emit("error", "You don't have permission to join this chat");
        return;
      }

      const roomId = `${chat_id}-${chat_type}`;
      socket.join(roomId);
      socket.emit("joined", `Joined chat room ${chat_id} (${chat_type})`);
      console.log(`${sender} joined chat room: ${chat_id} (${chat_type})`);
    } catch (err) {
      console.error("join_chat error:", err);
      socket.emit("error", "Error joining chat");
    }
  });

  // ------------------- SEND MESSAGE -------------------
  socket.on(
    "send_message",
    async (
      {
        chat_id,
        chat_type,
        sender,
        sender_id,
        message_content,
        message_type,
        attachment_url,
        parent_message_id,
        parent_message_content,
        parent_sender,
        client_message_id,
      },
      callback
    ) => {
      try {
        // Validate chatType is provided
        if (!chat_type) {
          if (typeof callback === "function") {
            callback("chat_type is required");
          } else {
            socket.emit("error", "chat_type is required");
          }
          return;
        }

        // Validate inputs
        if (!chat_id || !sender || !message_content || !sender_id) {
          if (typeof callback === "function")
            callback("Missing required fields.");
          else socket.emit("error", "Missing required fields.");
          return;
        }

        // Validate sender type
        const validSenders = ["customer", "vendor", "em", "anonymous_customer"];
        if (!validSenders.includes(sender)) {
          if (typeof callback === "function") callback("Invalid sender type");
          else socket.emit("error", "Invalid sender type");
          return;
        }

        // Validate senderType matches chatType permissions
        if (chat_type === "vendor-admin" && sender !== "vendor" && sender !== "em") {
          if (typeof callback === "function") {
            callback("You don't have permission to send messages in this chat");
          } else {
            socket.emit("error", "You don't have permission to send messages in this chat");
          }
          return;
        }

        if (chat_type === "customer-admin" && sender !== "customer" && sender !== "em") {
          if (typeof callback === "function") {
            callback("You don't have permission to send messages in this chat");
          } else {
            socket.emit("error", "You don't have permission to send messages in this chat");
          }
          return;
        }

        if (chat_type === "anon_customer-admin" && sender !== "anonymous_customer" && sender !== "em") {
          if (typeof callback === "function") {
            callback("You don't have permission to send messages in this chat");
          } else {
            socket.emit("error", "You don't have permission to send messages in this chat");
          }
          return;
        }

        if (chat_type === "vendor-enquiry" && sender !== "vendor" && sender !== "em") {
          if (typeof callback === "function") {
            callback("You don't have permission to send messages in this chat");
          } else {
            socket.emit("error", "You don't have permission to send messages in this chat");
          }
          return;
        }
        // Validate content type
        const validTypes = [
          "text",
          "image",
          "video",
          "pdf",
          "file",
          "approval_request",
          "order",
          "vendor_card",        
          "system",             
          "options",            
          "order_summary",
          "login_prompt",
          "review_prompt"
        ];
        const final_message_type = validTypes.includes(message_type)
          ? message_type
          : "text";

        const systemMessageTypes = ["vendor_card", "approval_request", "order", "system", "options", "order_summary", "login_prompt", "review_prompt"];

        if (!systemMessageTypes.includes(message_type)) {
          const isInteractiveChat = ["anon_customer-admin", "customer-admin"].includes(chat_type);
          
          if (!isInteractiveChat && (checkPhoneNumber(message_content) || checkEmails(message_content))) {
            console.log("Personal information detected:", message_content);
            if (typeof callback === "function") {
              callback("Please refrain from sharing personal information!");
            } else {
              socket.emit("error", "Please refrain from sharing personal information!");
            }
            return;
          }

          if (checkProfanity(message_content)) {
            console.log("Profanity detected:", message_content);
            if (typeof callback === "function") {
              callback("Please refrain from using abusive words!");
            } else {
              socket.emit("error", "Please refrain from using abusive words!");
            }
            return;
          }
        }

        const chat = await Chat.findOne({ chat_id, chat_type });
        if (!chat) {
          if (typeof callback === "function") callback("Invalid chat_id or chat_type");
          else socket.emit("error", "Invalid chat_id or chat_type");
          return;
        }

        if (chat.chat_status === "BLOCKED") {
          if (typeof callback === "function") {
            callback("This chat is blocked. You cannot send messages.");
          } else {
            socket.emit(
              "error",
              "This chat is blocked. You cannot send messages."
            );
          }
          return;
        }

        // Validate parent message id
        const validParent =
          parent_message_id && /^[a-fA-F0-9]{24}$/.test(parent_message_id)
            ? parent_message_id
            : null;

        // ------------------- CREATE MESSAGE -------------------
        const message = new Message({
          chat_id,
          chat_type,
          sender,
          sender_id,
          message_content,
          message_type: final_message_type,
          attachment_url: attachment_url || null,
          parent_message_id: validParent,
        });

        // Check if this is the first vendor_card from an EM in this chat
        if (sender === "em" && final_message_type === "vendor_card") {
          const existingVendorCard = await Message.findOne({
            chat_id,
            chat_type,
            sender: "em",
            message_type: "vendor_card",
          });

          if (!existingVendorCard) {
            // Create and save intro message
            const introMessage = new Message({
              chat_id,
              chat_type,
              sender: "em",
              sender_id,
              message_content: "Here's a vendor recommendation for you",
              message_type: "text",
            });
            const savedIntro = await introMessage.save();

            // Emit intro message to room
            const roomId = `${chat_id}-${chat_type}`;
            io.to(roomId).emit("new_message", {
              _id: savedIntro._id,
              chat_id: savedIntro.chat_id,
              chat_type: chat_type,
              sender: savedIntro.sender,
              sender_id: savedIntro.sender_id,
              message_content: savedIntro.message_content,
              message_type: savedIntro.message_type,
              message_sent_at: savedIntro.message_sent_at,
            });
            console.log(`📤 Sent intro message for first vendor card in chat ${chat_id}`);
          }
        }

        const savedMessage = await message.save();

        // ------------------- UPDATE VENDOR ENQUIRY IF APPLICABLE -------------------
        if (chat_type === "vendor-enquiry") {
          await updateEnquiryWithMessage(
            chat_id,
            message_content,
            sender
          );
        }

        // ------------------- AUTO-ASSIGN EM TO CHAT -------------------
        // If sender is EM and chat doesn't have an assigned EM, update it.
        if (sender === "em" && (!chat.em_id || chat.em_id === "")) {
            chat.em_id = sender_id;
            await chat.save();
            console.log(`✅ Auto-assigned EM ${sender_id} to chat ${chat_id}`);
        }

        // ------------------- EMIT TO ROOM -------------------
        const roomId = `${chat_id}-${chat_type}`;
        io.to(roomId).emit("new_message", {
          _id: savedMessage._id,
          chat_id: savedMessage.chat_id,
          chat_type: chat_type,
          sender: savedMessage.sender,
          sender_id: savedMessage.sender_id,
          message_content: savedMessage.message_content,
          message_type: savedMessage.message_type,
          attachment_url: savedMessage.attachment_url,
          parent_message_id: parent_message_id,
          parent_message_content,
          parent_sender,
          message_sent_at: savedMessage.message_sent_at,
          client_message_id,
        });

        console.log(
          `📤 ${savedMessage.sender} sent ${savedMessage.message_type} message in chat ${savedMessage.chat_id} (${chat_type})`
        );

        // ------------------- CUSTOMER NOTIFICATION -------------------
        if ((sender === "em" || sender === "admin") && 
            (chat_type === "customer-admin" || chat_type === "anon_customer-admin")) {
          const customerId = chat.customer_id || chat.anon_customer_id;
          if (customerId) {
            try {
              const notification = new customerNotification({
                customer_id: customerId,
                chat_id: chat_id,
                notification_type: 'chat_message',
                message: `New message from Eventory: ${message_content.length > 50 ? message_content.substring(0, 47) + '...' : message_content}`,
                read: false,
              });
              await notification.save();

              // Emit notification to customer room
              const customerRoom = `notifications-${customerId}`;
              io.to(customerRoom).emit("new_notification", {
                type: 'chat_message',
                chat_id: chat_id,
                message: notification.message,
                timestamp: notification.createdAt,
              });
              
              console.log(`🔔 Notification sent to customer ${customerId}`);
            } catch (notifErr) {
              console.error("Failed to create customer notification:", notifErr);
            }
          }
        }

        // ------------------- ACK TO SENDER -------------------
        if (typeof callback === "function") {
          callback(null, savedMessage);
        }

        if (((chat_type === "anon_customer-admin" && sender === "anonymous_customer") || 
            (chat_type === "customer-admin" && sender === "customer")) && !attachment_url) {
            await handleInteractiveMessage(chat_id, sender_id, message_content?.trim(), io);
        }
      } catch (err) {
        console.error("send_message error:", err);
        if (typeof callback === "function") {
          callback("Error sending message");
        } else {
          socket.emit("error", "Error sending message");
        }
      }
    }
  );

  // ------------------- EDIT MESSAGE -------------------
  socket.on(
    "edit_message",
    async (
      {
        message_id,
        new_content,
        chat_id,
        chat_type,
        sender_id,
      },
      callback
    ) => {
      try {
        // Validate required fields
        console.log("edit_message called with:", {message_id, new_content, chat_id, chat_type, sender_id});
        if (!message_id || !new_content || !chat_id || !chat_type || !sender_id) {
          if (typeof callback === "function") {
            callback("Missing required fields for edit");
          } else {
            socket.emit("error", "Missing required fields for edit");
          }
          return;
        }

        // Validate message_id format
        if (!mongoose.Types.ObjectId.isValid(message_id)) {
          if (typeof callback === "function") {
            callback("Invalid message_id");
          } else {
            socket.emit("error", "Invalid message_id");
          }
          return;
        }

        // Validate chat_type
        if (!chat_type) {
          if (typeof callback === "function") {
            callback("chat_type is required");
          } else {
            socket.emit("error", "chat_type is required");
          }
          return;
        }

        // Check if chat exists and is not blocked
        const chat = await Chat.findOne({ chat_id, chat_type });
        if (!chat) {
          if (typeof callback === "function") {
            callback("Chat not found");
          } else {
            socket.emit("error", "Chat not found");
          }
          return;
        }

        if (chat.chat_status === "BLOCKED") {
          if (typeof callback === "function") {
            callback("Cannot edit messages in a blocked chat");
          } else {
            socket.emit("error", "Cannot edit messages in a blocked chat");
          }
          return;
        }

        // Find the message
        const message = await Message.findOne({
            $or: [
            { _id: message_id },
            { message_id: message_id }
        ],
          chat_id,
          chat_type,
        });

        if (!message) {
          if (typeof callback === "function") {
            callback("Message not found");
          } else {
            socket.emit("error", "Message not found");
          }
          return;
        }

        // Validate ownership - only sender can edit their message
        if (message.sender_id !== sender_id) {
          if (typeof callback === "function") {
            callback("You can only edit your own messages");
          } else {
            socket.emit("error", "You can only edit your own messages");
          }
          return;
        }

        // Validate message type - cannot edit system, approval_request, or order messages
        const nonEditableTypes = ["system", "approval_request", "order"];
        if (nonEditableTypes.includes(message.message_type)) {
          if (typeof callback === "function") {
            callback(`Cannot edit ${message.message_type} messages`);
          } else {
            socket.emit("error", `Cannot edit ${message.message_type} messages`);
          }
          return;
        }

        // Validate content for profanity and personal info
        if (checkPhoneNumber(new_content) || checkEmails(new_content)) {
          console.log("❌ Personal information detected in edit:", new_content);
          if (typeof callback === "function") {
            callback("Please refrain from sharing personal information!");
          } else {
            socket.emit(
              "error",
              "Please refrain from sharing personal information!"
            );
          }
          return;
        }

        if (checkProfanity(new_content)) {
          console.log("❌ Profanity detected in edit:", new_content);
          if (typeof callback === "function") {
            callback("Please refrain from using abusive words!");
          } else {
            socket.emit("error", "Please refrain from using abusive words!");
          }
          return;
        }

        // Update the message
        const now = new Date();
        message.message_content = new_content;
        message.is_edited = true;
        message.edited_at = now;

        const updatedMessage = await message.save();

        // Emit to entire room for real-time update
        const roomId = `${chat_id}-${chat_type}`;
        io.to(roomId).emit("message_edited", {
          message_id: updatedMessage._id,
          chat_id: updatedMessage.chat_id,
          chat_type: updatedMessage.chat_type,
          new_content: updatedMessage.message_content,
          is_edited: updatedMessage.is_edited,
          edited_at: updatedMessage.edited_at,
          sender: updatedMessage.sender,
          sender_id: updatedMessage.sender_id,
        });

        console.log(
          `✏️ Message ${message_id} edited by ${message.sender} in chat ${chat_id} (${chat_type})`
        );

        // Send acknowledgment to sender
        if (typeof callback === "function") {
          callback(null, {
            message_id: updatedMessage._id,
            new_content: updatedMessage.message_content,
            is_edited: true,
            edited_at: updatedMessage.edited_at,
          });
        }
      } catch (err) {
        console.error("edit_message error:", err);
        if (typeof callback === "function") {
          callback("Error editing message");
        } else {
          socket.emit("error", "Error editing message");
        }
      }
    }
  );

  // ------------------- DISCONNECT -------------------
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
};

export const getMessagesByChatId = async (req, res) => {
  const { chatId } = req.params;
  const { cursor, chatType } = req.query;
  const limit = 15;

  try {
    // Prevent caching to ensure fresh messages
    res.set('Cache-Control', 'no-store');

    if (!chatType) {
      return res.status(400).json({ error: "chatType is required" });
    }
    
    // Trim chatId to ensure lookup works
    const trimmedChatId = chatId.trim();

    // Validate chatType
    if (!["vendor-admin", "customer-admin", "vendor-enquiry", "anon_customer-admin"].includes(chatType)) {
      return res.status(400).json({ error: "Invalid chatType" });
    }

    // Verify the chat exists with this chatType
    const chatSearchQuery = { chat_id: trimmedChatId };
    if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      chatSearchQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      chatSearchQuery.chat_type = chatType;
    }

    const chatExists = await Chat.findOne(chatSearchQuery);
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // ✅ match new field name
    let query = { chat_id: trimmedChatId };

    if (chatType === "vendor-admin") {
      query.chat_type = "vendor-admin";
    } else if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      // Show both to maintain history across login/anonymous states
      query.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      query.chat_type = chatType;
    }

    // ✅ for pagination
    if (cursor) {
      query._id = { $lte: new mongoose.Types.ObjectId(cursor) };
    }

    // ✅ update sort fields to match new schema
    const messages = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "parent_message_id",
        select: "message_content sender", // ✅ new fields
      })
      .lean();

    let hasMore = false;
    let nextCursor = null;

    if (messages.length > limit) {
      hasMore = true;
      nextCursor = messages[limit]._id;
    }

    const resultMessages = messages.slice(0, limit);

    // ✅ Map populated parent fields properly
    resultMessages.forEach((msg) => {
      if (msg.parent_message_id && typeof msg.parent_message_id === "object") {
        msg.parentText = msg.parent_message_id.message_content;
        msg.parentSender = msg.parent_message_id.sender;
        msg.parent_message_id = msg.parent_message_id._id; // keep only ID
      }
    });

    res.status(200).json({
      messages: resultMessages,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
export const searchMessages = async (req, res) => {
  const { chat_id } = req.params;
  const { q, chatType } = req.query;

  if (!q || !chat_id) {
    return res
      .status(400)
      .json({ error: "Query (q) and chat_id are required" });
  }

  if (!chatType) {
    return res.status(400).json({ error: "chatType is required" });
  }

  if (!["vendor-admin", "customer-admin", "vendor-enquiry", "anon_customer-admin"].includes(chatType)) {
    return res.status(400).json({ error: "Invalid chatType" });
  }

  try {
    const chatSearchQuery = { chat_id };
    if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      chatSearchQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      chatSearchQuery.chat_type = chatType;
    }

    const chatExists = await Chat.findOne(chatSearchQuery);
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messageQuery = {
      chat_id,
      message_content: { $regex: q, $options: "i" },
    };

    if (chatType === "vendor-admin") {
      messageQuery.chat_type = "vendor-admin";
    } else if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      messageQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      messageQuery.chat_type = chatType;
    }

    const messages = await Message.find(messageQuery).sort({ createdAt: -1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error searching messages:", err);
    res.status(500).json({ error: "Failed to search messages" });
  }
};

export const getMessageContext = async (req, res) => {
  const { chatId, qId } = req.params;
  const { chatType } = req.query;

  if (!mongoose.Types.ObjectId.isValid(qId)) {
    return res.status(400).json({ error: "Invalid messageId (qId)" });
  }

  if (!chatType) {
    return res.status(400).json({ error: "chatType is required" });
  }

  if (!["vendor-admin", "customer-admin", "vendor-enquiry", "anon_customer-admin"].includes(chatType)) {
    return res.status(400).json({ error: "Invalid chatType" });
  }

  try {
    const chatSearchQuery = { chat_id: chatId };
    if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      chatSearchQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      chatSearchQuery.chat_type = chatType;
    }

    const chatExists = await Chat.findOne(chatSearchQuery);
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messageQuery = { _id: qId, chat_id: chatId };
    if (chatType === "vendor-admin") {
      messageQuery.chat_type = "vendor-admin";
    } else if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      messageQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      messageQuery.chat_type = chatType;
    }

    const currentMessage = await Message.findOne(messageQuery);
    if (!currentMessage) {
      return res
        .status(404)
        .json({ error: "Message not found in the given chat" });
    }

    const contextQuery = {
      chat_id: chatId,
    };
    if (chatType === "vendor-admin") {
      contextQuery.chat_type = "vendor-admin";
    } else if (chatType === "customer-admin" || chatType === "anon_customer-admin") {
      contextQuery.chat_type = { $in: ["customer-admin", "anon_customer-admin"] };
    } else {
      contextQuery.chat_type = chatType;
    }

    const olderMessages = await Message.find({
      ...contextQuery,
      _id: { $lt: new mongoose.Types.ObjectId(qId) },
    })
      .sort({ _id: -1 })
      .limit(20);

    const newerMessages = await Message.find({
      ...contextQuery,
      _id: { $gt: new mongoose.Types.ObjectId(qId) },
    })
      .sort({ _id: 1 })
      .limit(15);

    const result = [
      ...olderMessages.reverse(),
      currentMessage,
      ...newerMessages,
    ];

    res.status(200).json({ messages: result });
  } catch (err) {
    console.error("Error fetching message context:", err);
    res.status(500).json({ error: "Failed to fetch message context" });
  }
};

export const uploadChatMedia = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const bucket = process.env.AWS_S3_BUCKET_NAME;

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const fileStream = fs.createReadStream(file.path);
          const stats = fs.statSync(file.path);
          const folder = getFolderName(file.mimetype);
          const fileKey = `chat/media/${folder}${file.filename}`;

          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            Body: fileStream,
            ContentType: file.mimetype,
            ContentLength: stats.size,
            ACL: "public-read",
          });

          await s3.send(command);
          console.log(`Successfully uploaded file to S3 via PutObject. URL: ${fileKey}`);

          // Generate URL with domain fallback based on environment
          const timestamp = req.body.timestamp || Date.now();
          
          let domainFallback = "https://d5b8uhuzdzhj3.cloudfront.net"; // Default (Prod)
          if (bucket === "eventory-bucket") {
            domainFallback = "https://d1u34m45xfa3ar.cloudfront.net"; // Dev
          }

          const cloudFrontDomain = process.env.CLOUDFRONT_URL || domainFallback;
          const baseUrl = cloudFrontDomain.endsWith("/") ? cloudFrontDomain.slice(0, -1) : cloudFrontDomain;
          const cloudFrontUrl = `${baseUrl}/${fileKey}?t=${timestamp}`;

          // Determine content type
          let contentType = "file";
          const mimeType = file.mimetype || "";
          if (mimeType.startsWith("image/")) contentType = "image";
          else if (mimeType.startsWith("video/")) contentType = "video";
          else if (mimeType === "application/pdf") contentType = "pdf";

          // Cleanup local file
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            console.error("Error deleting local file after S3 upload:", unlinkErr);
          }

          return {
            attachment_url: cloudFrontUrl,
            url: cloudFrontUrl,
            message_type: contentType,
            original_name: file.originalname,
          };
        } catch (fileErr) {
          console.error(`Error uploading individual file ${file.originalname}:`, fileErr);
          throw fileErr;
        }
      })
    );

    // Provide backward compatible response if only one file was uploaded
    if (results.length === 1) {
      return res.status(200).json({
        message: "File uploaded successfully",
        ...results[0],
        files: results
      });
    }

    res.status(200).json({
      message: "Files uploaded successfully",
      files: results,
      // Fallback for single file extractors using the first file
      attachment_url: results[0].attachment_url,
      message_type: results[0].message_type,
      url: results[0].url
    });
  } catch (error) {
    console.error("Error in uploadChatMedia:", error);
    res.status(500).json({ error: "Error uploading media to S3", details: error.message });
  }
};
export const pinMessageInChat = async (req, res) => {
  try {
    const { chat_id, message_id } = req.params;

    console.log(`chat_id: ${chat_id}, message_id: ${message_id}`);

    if (!chat_id || !message_id) {
      return res
        .status(400)
        .json({ error: "chat_id and message_id are required" });
    }

    // Validate MongoDB IDs
    if (
      // !mongoose.Types.ObjectId.isValid(chat_id) ||
      !mongoose.Types.ObjectId.isValid(message_id)
    ) {
      return res.status(400).json({ error: "Invalid chat_id or message_id" });
    }

    // Find chat
    const chat = await Chat.findOne({ chat_id });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Initialize pinned_chat_messages if not present
    if (!Array.isArray(chat.pinned_chat_messages)) {
      chat.pinned_chat_messages = [];
    }

    // Pin message if not already pinned
    if (!chat.pinned_chat_messages.includes(message_id)) {
      chat.pinned_chat_messages.push(message_id);
      await chat.save();
    }

    return res.status(200).json({
      message: "Message pinned successfully",
      pinned_chat_messages: chat.pinned_chat_messages,
    });
  } catch (error) {
    console.error("Error while pinning message:", error);
    return res.status(500).json({ error: "Could not pin message" });
  }
};
export const unpinMessageInChat = async (req, res) => {
  try {
    const { chat_id, message_id } = req.params;

    if (!chat_id || !message_id) {
      return res
        .status(400)
        .json({ error: "chat_id and message_id are required" });
    }

    // Find chat by chat_id
    const chat = await Chat.findOne({ chat_id });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // If pinned_chat_messages is empty, return
    if (!Array.isArray(chat.pinned_chat_messages)) {
      chat.pinned_chat_messages = [];
    }

    // Remove message_id (convert to string for reliable comparison)
    chat.pinned_chat_messages = chat.pinned_chat_messages.filter(
      (id) => id.toString() !== message_id.toString()
    );

    await chat.save();

    return res.status(200).json({
      message: "Message unpinned successfully",
      pinned_chat_messages: chat.pinned_chat_messages,
    });
  } catch (error) {
    console.error("Couldn't unpin message:", error);
    return res.status(500).json({ error: "Could not unpin message" });
  }
};

export const blockChat = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { chat_type } = req.query;

    if (!chat_id) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if (!chat_type) {
      return res.status(400).json({ error: "chat_type is required" });
    }

    if (!["vendor-admin", "customer-admin", "anon_customer-admin"].includes(chat_type)) {
      return res.status(400).json({ error: "Invalid chat_type" });
    }

    const chat = await Chat.findOne({ chat_id, chat_type });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.chat_status === "BLOCKED") {
      return res.status(200).json({ message: "Chat is already blocked" });
    }

    chat.chat_status = "BLOCKED";
    await chat.save();

    return res.status(200).json({ message: "Chat blocked successfully", chat });
  } catch (error) {
    console.error("Couldn't block chat:", error);
    return res.status(500).json({ error: "Could not block chat" });
  }
};

export const unblockChat = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { chat_type } = req.query;

    if (!chat_id) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if (!chat_type) {
      return res.status(400).json({ error: "chat_type is required" });
    }

    if (!["vendor-admin", "customer-admin", "vendor-enquiry", "anon_customer-admin"].includes(chat_type)) {
      return res.status(400).json({ error: "Invalid chat_type" });
    }

    const chat = await Chat.findOne({ chat_id, chat_type });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.chat_status === "ACTIVE") {
      return res.status(200).json({ message: "Chat is already ACTIVE" });
    }

    chat.chat_status = "ACTIVE";
    await chat.save();

    return res
      .status(200)
      .json({ message: "Chat unblocked successfully", chat });
  } catch (error) {
    console.error("Couldn't unblock chat:", error);
    return res.status(500).json({ error: "Could not unblock chat" });
  }
};
export const getPinnedMessages = async (req, res) => {
  try {
    const { chat_id } = req.params;

    // Find chat by chat_id
    const chat = await Chat.findOne({ chat_id });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // If there are no pinned messages
    if (!chat.pinned_chat_messages || chat.pinned_chat_messages.length === 0) {
      return res.status(200).json({ pinned_chat_messages: [] });
    }

    // Find messages using message_id (not _id)
    const pinnedMessages = await Message.find({
      message_id: { $in: chat.pinned_chat_messages.map(id => new mongoose.Types.ObjectId(id)) },
    }).select("message_content message_type sender attachment_url message_sent_at");

    return res.status(200).json({ pinned_chat_messages: pinnedMessages });
  } catch (error) {
    console.error("Error fetching pinned messages:", error);
    return res.status(500).json({ error: "Server error" });
  }
};


// Api to get blocked chats
export const getBlockedChats = async (req, res) => {
  try {
    const blockedChats = await Chat.find({ chat_status: "BLOCKED" })
      .sort({ updatedAt: -1 }); // Sort by most recently updated
    return res.status(200).json({ blockedChats });
  } catch (error) {
    console.error("Error fetching blocked chats:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// export const getCustomerNotifications = async (req, res) => {
//   try {
//     // your logic here
//     return res.status(200).json({ message: "Notifications fetched successfully" });
//   } catch (error) {
//     console.error("Error in getCustomerNotifications:", error);
//     return res.status(500).json({ error: "Failed to fetch notifications" });
//   }
// };
export const getCustomerNotifications = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const notifications = await customerNotification
      .find({ customer_id })
      .sort({ createdAt: -1 }); // Sort by most recent notifications

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Not worked on this yet.
// export const markNotificationAsRead = async (req, res) => {
//   try {
//     const { notificationId } = req.params;

//     if (!notificationId) {
//       return res.status(400).json({ error: "Notification ID is required" });
//     }

//     // Assuming you have a Notification model
//     const notification = await customerNotification.findById(notificationId);
//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     notification.read = true; // Mark as read
//     await notification.save();

//     return res.status(200).json({ message: "Notification marked as read" });
//   } catch (error) {
//     console.error("Error marking notification as read:", error);
//     return res
//       .status(500)
//       .json({ error: "Failed to mark notification as read" });
//   }
// };

export const markAllCustomerNotificationsAsRead = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    await customerNotification.updateMany(
      { customer_id, read: false },
      { $set: { read: true } }
    );

    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res
      .status(500)
      .json({ error: "Failed to mark notifications as read" });
  }
};

// Update em_id in Chat when admin sends first message
export const updateChatEmId = async (req, res) => {
  try {
    const { chat_id, em_id } = req.body;


    console.log(`Received request to update em_id for chat_id: ${chat_id} to em_id: ${em_id}`);

    if (!chat_id || !em_id) {
      return res.status(400).json({
        message: "chat_id and em_id are required"
      });
    }

    // Find the chat first
    const chat = await Chat.findOne({ chat_id });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if em_id is already set (truthy value)
    // If em_id is null, undefined, or "", we allow update.
    if (chat.em_id) {
       return res.status(200).json({
        message: "Chat already has an assigned EM",
        data: chat
      });
    }

    // Update em_id
    chat.em_id = em_id;
    const updatedChat = await chat.save();

    res.status(200).json({
      message: "Chat em_id updated successfully",
      data: updatedChat
    });
  } catch (error) {
    console.error("Error updating chat em_id:", error);
    res.status(500).json({
      message: "Error updating chat em_id",
      error: error.message
    });
  }
};

// export const getMessagesByChatId = async (req, res) => {
//     const { chatId } = req.params;
//     const queryOptions = { ...req.query }; // allows dynamic pagination, sorting, etc.
//     queryOptions["limit"] = parseInt(queryOptions.limit) || 15; // default limit to 15 if not specified

//     try {
//         const features = new APIFeatures(
//             // Return messages in descending order (newest first)
//             // This way we'll get the most recent messages in each page
//             Message.find({ chatId }).sort({ createdAt: -1 }),
//             queryOptions
//         )
//             .sort()
//             .limitFields()
//             .paginate();

//         const messages = await features.query;

//         const total = await Message.countDocuments({ chatId });
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(queryOptions.limit) || 15;

//         res.status(200).json({
//             messages,
//             total,
//             page,
//             limit,
//             totalPages: Math.ceil(total / limit),
//             hasMore: (page - 1) * limit + messages.length < total,
//         });
//     } catch (err) {
//         console.error("Error fetching messages:", err);
//         res.status(500).json({ error: "Failed to fetch messages" });
//     }
// };

// export const uploadChatMedia = async (req, res) => {
//   try {
//     if (!req.file || !req.file.location) {
//       return res.status(400).json({ error: "No media file uploaded" });
//     }

//     return res.status(200).json({
//       url: req.file.location,
//       message: "Media uploaded successfully",
//     });
//   } catch (error) {
//     console.error("Error uploading chat media:", error);
//     return res.status(500).json({ error: "Failed to upload media" });
//   }
// };

// export const editMessage = async (req, res) => {
//   try {
//     const { message_id } = req.params;
//     const { new_content, chat_id, chat_type, sender_id } = req.body;

//     if (!new_content || !chat_id || !chat_type || !sender_id) {
//       return res.status(400).json({
//         error: "Missing required fields: new_content, chat_id, chat_type, sender_id"
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(message_id)) {
//       return res.status(400).json({ error: "Invalid message_id" });
//     }

//     if (!["vendor-admin", "customer-admin", "vendor-enquiry"].includes(chat_type)) {
//       return res.status(400).json({ error: "Invalid chat_type" });
//     }

//     const chat = await Chat.findOne({ chat_id, chat_type });
//     if (!chat) {
//       return res.status(404).json({ error: "Chat not found" });
//     }

//     if (chat.chat_status === "BLOCKED") {
//       return res.status(403).json({
//         error: "Cannot edit messages in a blocked chat"
//       });
//     }

//     const message = await Message.findOne({
//       message_id: message_id,
//       chat_id,
//       chat_type,
//     });

//     if (!message) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     if (message.sender_id !== sender_id) {
//       return res.status(403).json({
//         error: "You can only edit your own messages"
//       });
//     }

//     const nonEditableTypes = ["system", "approval_request", "order"];
//     if (nonEditableTypes.includes(message.message_type)) {
//       return res.status(403).json({
//         error: `Cannot edit ${message.message_type} messages`
//       });
//     }

//     if (checkPhoneNumber(new_content) || checkEmails(new_content)) {
//       return res.status(400).json({
//         error: "Please refrain from sharing personal information!"
//       });
//     }

//     if (checkProfanity(new_content)) {
//       return res.status(400).json({
//         error: "Please refrain from using abusive words!"
//       });
//     }

//     const now = new Date();
//     message.message_content = new_content;
//     message.is_edited = true;
//     message.edited_at = now;

//     const updatedMessage = await message.save();

//     // Emit to all clients in the room via Socket.IO
//     const io = req.io;
//     if (io) {
//       const roomId = `${chat_id}-${chat_type}`;
//       io.to(roomId).emit("message_edited", {
//         message_id: updatedMessage.message_id,
//         chat_id: updatedMessage.chat_id,
//         chat_type: updatedMessage.chat_type,
//         new_content: updatedMessage.message_content,
//         is_edited: true,
//         edited_at: updatedMessage.edited_at,
//         sender: updatedMessage.sender,
//         sender_id: updatedMessage.sender_id,
//       });
//       console.log(`✏️ [REST API] Emitted message_edited to room ${roomId}`);
//     } else {
//       console.warn("⚠️ Socket.IO instance not available in editMessage controller");
//     }

//     return res.status(200).json({
//       message: "Message edited successfully",
//       data: {
//         message_id: updatedMessage.message_id,
//         chat_id: updatedMessage.chat_id,
//         chat_type: updatedMessage.chat_type,
//         new_content: updatedMessage.message_content,
//         is_edited: updatedMessage.is_edited,
//         edited_at: updatedMessage.edited_at,
//         sender: updatedMessage.sender,
//         sender_id: updatedMessage.sender_id,
//       },
//     });
//   } catch (error) {
//     console.error("Error editing message:", error);
//     return res.status(500).json({
//       error: "Failed to edit message",
//       details: error.message
//     });
//   }
// };

export const getChatDetails = async (req, res) => {
  try {
    const { chat_id } = req.params;

    if (!chat_id) {
      return res.status(400).json({ error: "chat_id is required" });
    }

    const chat = await Chat.findOne({ chat_id });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.status(200).json({
      success: true,
      chat_id: chat.chat_id,
      em_id: chat.em_id,
      chat_status: chat.chat_status,
      chat_type: chat.chat_type
    });
  } catch (error) {
    console.error("Error fetching chat details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
