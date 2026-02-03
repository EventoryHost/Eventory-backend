import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import { sendSlackAnonChatMessage } from "../utils/slackNotifier.js";
import generateUniqueId from "../utils/generateId.js";
import AnonymousUser from "../models/anonymousUser.js";
import { handleInteractiveMessage } from "../services/interactiveChatService.js";
import EMNotifications from "../models/emNotifications.js";
import EventManager from "../models/eventManager.js";

export const sendAnonymousMessage = async (req, res) => {
  try {
    const {
      anon_customer_id,
      message_content,
      message_type,
      attachment_url,
      metadata,
      chat_id,
    } = req.body;

    if (!anon_customer_id || !message_content) {
      return res
        .status(400)
        .json({ error: "anon_customer_id and message_content are required" });
    }

    let chat;

    // 1. Try to find chat by chat_id if provided (Robustness fix)
    if (chat_id) {
      chat = await Chat.findOne({ chat_id, chat_type: "anon_customer-admin" });
    }

    // 2. If no chat_id or chat not found, try to find ACTIVE chat by anon_customer_id
    if (!chat) {
      chat = await Chat.findOne({
        anon_customer_id,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE",
      });
    }

    let isNewChat = false;

    if (!chat) {
      isNewChat = true;
      chat = await Chat.create({
        chat_id: generateUniqueId("CHAT"),
        anon_customer_id,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE",
        // We can store metadata if we add a field for it in Chat schema,
        // or just rely on the first message/logs.
        // For now, we just use it for Slack notification.
      });
    }

    const newMessage = await Message.create({
      chat_id: chat.chat_id,
      chat_type: "anon_customer-admin",
      sender: "anonymous_customer",
      sender_id: anon_customer_id,
      message_content,
      message_type: message_type || "text",
      attachment_url: attachment_url || null,
    });

    if (req.io) {
      const roomId = `${chat.chat_id}-anon_customer-admin`;
      req.io.to(roomId).emit("new_message", {
        _id: newMessage._id,
        chat_id: newMessage.chat_id,
        chat_type: newMessage.chat_type,
        sender: newMessage.sender,
        sender_id: newMessage.sender_id,
        message_content: newMessage.message_content,
        message_type: newMessage.message_type,
        message_sent_at: newMessage.message_sent_at,
        attachment_url: newMessage.attachment_url,
      });
    }

    // Update chat timestamps
    if (chat.updateLastMessage) {
      await chat.updateLastMessage();
    } else {
      // Fallback if method not available (though it should be)
      chat.last_message_updated_at = new Date();
      chat.chat_updated_at = new Date();
      await chat.save();
    }

    if (isNewChat) {
      sendSlackAnonChatMessage({
        chatId: chat.chat_id,
        anonCustomerId: anon_customer_id,
        messageContent: message_content,
        metadata,
      });

      // Notify all EMs about the new anonymous chat
      try {
        const allEMs = await EventManager.find({}, "em_id");
        if (allEMs.length > 0) {
          const notifications = allEMs.map((em) => ({
            em_id: em.em_id,
            chat_id: chat.chat_id,
            message: `A new user started a chat (${anon_customer_id}), check the recent customer inquiry!`,
            notification_type: "chat_message",
            timestamp: new Date().toISOString(),
            read: false,
          }));
          await EMNotifications.insertMany(notifications);
        }
      } catch (err) {
        console.error("Failed to create EM notifications for new chat:", err);
      }
    }

    // --- INTERACTIVE FLOW LOGIC ---
    // Delegate to service
    await handleInteractiveMessage(
      chat.chat_id,
      anon_customer_id,
      message_content,
      req.io,
    );

    // Update AnonymousUser activity (fire and forget or await)
    await AnonymousUser.findOneAndUpdate(
      { anon_id: anon_customer_id },
      {
        last_seen_at: new Date(),
      },
    ).catch((err) =>
      console.error("Failed to update anon user activity:", err),
    );

    res.status(201).json({
      message: "Message sent",
      data: newMessage,
      chat_id: chat.chat_id,
    });
  } catch (error) {
    console.error("Error sending anonymous message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages for an anonymous customer
export const getAnonymousMessages = async (req, res) => {
  try {
    const { anon_customer_id } = req.params;
    const { cursor } = req.query;
    const limit = 20;

    if (!anon_customer_id) {
      return res.status(400).json({ error: "anon_customer_id is required" });
    }

    // Find the most recent chat (ACTIVE or FINISHED)
    // If multiple chats exist (e.g. old finished ones), we might want to return messages from the latest one
    // or all of them?
    // User said: "Same anon_customer_id should map to the same chat history"
    // This implies we should show history across all chats or just the current one.
    // Usually, for a floating chat, you want to see previous conversation.
    // But if we create a NEW chat when old one is FINISHED, do we link them?
    // The user said "Chat lifecycle: ACTIVE, FINISHED".
    // If we create a NEW chat, it has a NEW chat_id.
    // If we want to show ALL history, we should query by `anon_customer_id` and `chat_type`.
    // However, `Message` schema has `chat_id`. It does NOT have `anon_customer_id`.
    // So we need to find ALL chat_ids for this `anon_customer_id` and then fetch messages for those chat_ids.

    const chats = await Chat.find({
      anon_customer_id,
      chat_type: "anon_customer-admin",
    }).select("chat_id");

    const chatIds = chats.map((c) => c.chat_id);

    if (chatIds.length === 0) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    let query = {
      chat_id: { $in: chatIds },
      chat_type: "anon_customer-admin",
    };

    if (cursor) {
      query._id = { $lt: cursor }; // Using $lt for descending sort (newest first)
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit + 1)
      .lean();

    let hasMore = false;
    let nextCursor = null;

    if (messages.length > limit) {
      hasMore = true;
      nextCursor = messages[limit]._id;
      messages.pop(); // Remove the extra one
    }

    res.status(200).json({
      messages: messages.reverse(), // Return oldest to newest for UI
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching anonymous messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get status of the current chat
export const getAnonymousChatStatus = async (req, res) => {
  try {
    const { anon_customer_id } = req.params;

    if (!anon_customer_id) {
      return res.status(400).json({ error: "anon_customer_id is required" });
    }

    const chat = await Chat.findOne({
      anon_customer_id,
      chat_type: "anon_customer-admin",
      chat_status: "ACTIVE",
    });

    if (chat) {
      res
        .status(200)
        .json({ status: "ACTIVE", chat_id: chat.chat_id, em_id: chat.em_id });
    } else {
      // Check if there was a finished chat
      const finishedChat = await Chat.findOne({
        anon_customer_id,
        chat_type: "anon_customer-admin",
        chat_status: "FINISHED",
      }).sort({ updatedAt: -1 });

      if (finishedChat) {
        res
          .status(200)
          .json({
            status: "FINISHED",
            chat_id: finishedChat.chat_id,
            em_id: finishedChat.em_id,
          });
      } else {
        res.status(200).json({ status: "NONE" });
      }
    }
  } catch (error) {
    console.error("Error fetching chat status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all anonymous chats for admin
export const getAllAnonymousChats = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { chat_type: "anon_customer-admin" };

    if (search) {
      query.anon_customer_id = { $regex: search, $options: "i" };
    }

    const chats = await Chat.find(query)
      .sort({ last_message_updated_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Chat.countDocuments(query);

    const enrichedChats = await Promise.all(
      chats.map(async (chat) => {
        const lastMsg = await Message.findOne({ chat_id: chat.chat_id })
          .sort({ createdAt: -1 })
          .select("message_content createdAt")
          .lean();

        return {
          chat_id: chat.chat_id,
          anon_user_id: chat.anon_customer_id,
          created_at: chat.chat_created_at || chat.createdAt,
          last_message: lastMsg ? lastMsg.message_content : "",
          last_message_time: lastMsg
            ? lastMsg.createdAt
            : chat.last_message_updated_at,
          status: chat.chat_status ? chat.chat_status.toLowerCase() : "active",
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: enrichedChats,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all anonymous chats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
