import { checkProfanity } from "../middlewares/checkPhoneNumber.js";
import { checkPhoneNumber } from "../middlewares/checkProfanity.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import APIFeatures from "../utils/apiFeatures.js";
import mongoose from "mongoose";
import { checkEmails } from "../middlewares/checkEmails.js";
import customerNotification from "../models/customerNotifications.js";

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
        const validSenders = ["customer", "vendor", "em"];
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

        // Validate content type
        const validTypes = [
          "text",
          "image",
          "video",
          "pdf",
          "file",
          "approval_request",
          "order",
        ];
        const final_message_type = validTypes.includes(message_type)
          ? message_type
          : "text";

        // Detect personal info or profanity
        if (checkPhoneNumber(message_content) || checkEmails(message_content)) {
          console.log("❌ Personal information detected:", message_content);
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

        if (checkProfanity(message_content)) {
          console.log("❌ Profanity detected:", message_content);
          if (typeof callback === "function") {
            callback("Please refrain from using abusive words!");
          } else {
            socket.emit("error", "Please refrain from using abusive words!");
          }
          return;
        }

        // Validate chat existence with chatType
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

        const savedMessage = await message.save();

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

        // ------------------- ACK TO SENDER -------------------
        if (typeof callback === "function") {
          callback(null, savedMessage);
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
        const chat = await Chat2.findOne({ chat_id, chat_type });
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
        const message = await Message2.findOne({
          _id: message_id,
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
    if (!chatType) {
      return res.status(400).json({ error: "chatType is required" });
    }

    // Validate chatType
    if (!["vendor-admin", "customer-admin"].includes(chatType)) {
      return res.status(400).json({ error: "Invalid chatType" });
    }

    // Verify the chat exists with this chatType
    const chatExists = await Chat.findOne({ chat_id: chatId, chat_type: chatType });
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // ✅ match new field name and include chat_type
    let query = { chat_id: chatId, chat_type: chatType };

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

  if (!["vendor-admin", "customer-admin"].includes(chatType)) {
    return res.status(400).json({ error: "Invalid chatType" });
  }

  try {
    const chatExists = await Chat.findOne({ chat_id, chat_type: chatType });
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await Message.find({
      chat_id,
      chat_type: chatType,
      message_content: { $regex: q, $options: "i" },
    }).sort({ createdAt: -1 });

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

  if (!["vendor-admin", "customer-admin"].includes(chatType)) {
    return res.status(400).json({ error: "Invalid chatType" });
  }

  try {
    const chatExists = await Chat.findOne({ chat_id: chatId, chat_type: chatType });
    if (!chatExists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const currentMessage = await Message.findOne({ _id: qId, chat_id: chatId, chat_type: chatType });
    if (!currentMessage) {
      return res
        .status(404)
        .json({ error: "Message not found in the given chat" });
    }

    const olderMessages = await Message.find({
      chat_id: chatId,
      chat_type: chatType,
      _id: { $lt: new mongoose.Types.ObjectId(qId) },
    })
      .sort({ _id: -1 })
      .limit(20);

    const newerMessages = await Message.find({
      chat_id: chatId,
      chat_type: chatType,
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

export const uploadChatMedia = (req, res) => {
  try {
    if (!req.file) {
      console.error("No file received in upload request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Log more details about the incoming file
    console.log("Server received file for upload:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      key: req.file.key,
      timestamp: req.body.timestamp || "none",
    });

    // Make sure we have a key for the file
    const fileKey = req.file.key;
    if (!fileKey) {
      console.error("No file key present in uploaded file");
      return res
        .status(500)
        .json({ error: "File upload failed - no file key" });
    }

    // Generate URL with timestamp if provided to prevent caching
    const timestamp = req.body.timestamp || Date.now();
    const cloudFrontUrl = `https://d1u34m45xfa3ar.cloudfront.net/${fileKey}?t=${timestamp}`;

    // Determine content type based on mime type
    let contentType = "file";
    const mimeType = req.file.mimetype || "";

    if (mimeType.startsWith("image/")) {
      contentType = "image";
    } else if (mimeType.startsWith("video/")) {
      contentType = "video";
    } else if (mimeType === "application/pdf") {
      contentType = "pdf";
    }

    console.log(`Successfully processed file upload. URL: ${cloudFrontUrl}`);

    return res.status(200).json({
      message: "File uploaded successfully",
      attachment_url: cloudFrontUrl,
      message_type: contentType,
      original_name: req.file.originalname,
    });
  } catch (error) {
    console.error("Error uploading chat media:", error);
    return res.status(500).json({ error: "Failed to upload media" });
  }
};
export const pinMessageInChat = async (req, res) => {
  try {
    const { chat_id , message_id } = req.params;

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
    const {chat_type} = req.query;

    if (!chat_id) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if(!chat_type){
      return res.status(400).json({ error: "chat_type is required" });
    }

    if(!["vendor-admin", "customer-admin"].includes(chat_type)){
      return res.status(400).json({ error: "Invalid chat_type" });
    }

    const chat = await Chat.findOne({ chat_id , chat_type });

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
    const {chat_type} = req.query;

    if (!chat_id) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if(!chat_type){
      return res.status(400).json({ error: "chat_type is required" });
    } 

    if(!["vendor-admin", "customer-admin"].includes(chat_type)){
      return res.status(400).json({ error: "Invalid chat_type" });
    }

    const chat = await Chat.findOne({ chat_id ,chat_type });    

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

    // Only update if current em_id is "admin-rm" (default/dummy value)
    const updatedChat = await Chat.findOneAndUpdate(
      { 
        chat_id: chat_id,
        em_id: "" // Only update if it's still the default
      },
      { 
        $set: { em_id: em_id } 
      },
      { 
        new: true // Return the updated document
      }
    );

    if (!updatedChat) {
      // Either chat not found OR em_id was already updated
      const existingChat = await Chat.findOne({ chat_id: chat_id });
      
      if (!existingChat) {
        return res.status(404).json({ 
          message: "Chat not found" 
        });
      }
      
      // Chat exists but em_id was already set (not "admin-rm")
      return res.status(200).json({
        message: "Chat already has an assigned EM",
        data: existingChat
      });
    }

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

export const editMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { new_content, chat_id, chat_type, sender_id } = req.body;

    if (!new_content || !chat_id || !chat_type || !sender_id) {
      return res.status(400).json({ 
        error: "Missing required fields: new_content, chat_id, chat_type, sender_id" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return res.status(400).json({ error: "Invalid message_id" });
    }

    if (!["vendor-admin", "customer-admin"].includes(chat_type)) {
      return res.status(400).json({ error: "Invalid chat_type" });
    }

    const chat = await Chat.findOne({ chat_id, chat_type });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.chat_status === "BLOCKED") {
      return res.status(403).json({ 
        error: "Cannot edit messages in a blocked chat" 
      });
    }

    const message = await Message.findOne({
      _id: message_id,
      chat_id,
      chat_type,
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender_id !== sender_id) {
      return res.status(403).json({ 
        error: "You can only edit your own messages" 
      });
    }

    const nonEditableTypes = ["system", "approval_request", "order"];
    if (nonEditableTypes.includes(message.message_type)) {
      return res.status(403).json({ 
        error: `Cannot edit ${message.message_type} messages` 
      });
    }

    if (checkPhoneNumber(new_content) || checkEmails(new_content)) {
      return res.status(400).json({ 
        error: "Please refrain from sharing personal information!" 
      });
    }

    if (checkProfanity(new_content)) {
      return res.status(400).json({ 
        error: "Please refrain from using abusive words!" 
      });
    }

    const now = new Date();
    message.message_content = new_content;
    message.is_edited = true;
    message.edited_at = now;

    const updatedMessage = await message.save();

    // Emit to all clients in the room via Socket.IO
    const io = req.io;
    if (io) {
      const roomId = `${chat_id}-${chat_type}`;
      io.to(roomId).emit("message_edited", {
        message_id: updatedMessage._id.toString(),
        chat_id: updatedMessage.chat_id,
        chat_type: updatedMessage.chat_type,
        new_content: updatedMessage.message_content,
        is_edited: true,
        edited_at: updatedMessage.edited_at,
        sender: updatedMessage.sender,
        sender_id: updatedMessage.sender_id,
      });
      console.log(`✏️ [REST API] Emitted message_edited to room ${roomId}`);
    } else {
      console.warn("⚠️ Socket.IO instance not available in editMessage controller");
    }

    return res.status(200).json({
      message: "Message edited successfully",
      data: {
        message_id: updatedMessage._id,
        chat_id: updatedMessage.chat_id,
        chat_type: updatedMessage.chat_type,
        new_content: updatedMessage.message_content,
        is_edited: updatedMessage.is_edited,
        edited_at: updatedMessage.edited_at,
        sender: updatedMessage.sender,
        sender_id: updatedMessage.sender_id,
      },
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return res.status(500).json({ 
      error: "Failed to edit message",
      details: error.message 
    });
  }
};
