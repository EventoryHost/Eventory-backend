import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import { sendSlackAnonChatMessage } from "../utils/slackNotifier.js";
import generateUniqueId from "../utils/generateId.js";
import AnonymousUser from "../models/anonymousUser.js";
import { handleInteractiveMessage } from "../services/interactiveChatService.js";
import { sendFCMNotificationToEm } from "../utils/firebaseNotificationUtils.js";
import EMNotifications from "../models/emNotifications.js";
import EventManager from "../models/eventManager.js";
import CustomerEnquiry from "../models/customerEnquiry.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Helper to verify JWT token
const verifyAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("JWT Verification failed:", err.message);
    return null;
  }
};

// Initialize an anonymous or customer chat session
export const initializeAnonymousChat = async (req, res) => {
  try {
    let { anon_customer_id, source, customer_id } = req.body;
    let chatType = "anon_customer-admin";
    let userId = anon_customer_id;

    console.log("DEBUG [init]: Start", {
      anon_customer_id,
      customer_id,
      source,
    });

    // Check for logged-in user
    const decodedUser = verifyAuth(req);
    console.log("DEBUG [init]: Decoded User", decodedUser);

    if (decodedUser && customer_id) {
      if (decodedUser.id === customer_id) {
        chatType = "customer-admin";
        userId = customer_id;
        console.log(
          "DEBUG [init]: Switching to customer-admin due to matching customer_id",
        );
      } else {
        console.warn("DEBUG [init]: Unauthorized customer_id mismatch");
        return res
          .status(403)
          .json({ error: "Unauthorized access to customer data" });
      }
    } else if (!anon_customer_id) {
      return res
        .status(400)
        .json({ error: "anon_customer_id or valid customer_id is required" });
    }

    // Robust ID normalization
    if (userId) userId = userId.toString().replace(/['"]/g, "");
    console.log("DEBUG [init]: Resolved userId", userId, "ChatType", chatType);

    let query = {
      chat_status: "ACTIVE",
    };

    if (chatType === "customer-admin") {
      query.chat_type = chatType;
      query.customer_id = userId;
    } else {
      // Relaxed query: Find ANY active chat with this anon_id, even if migrated
      query.anon_customer_id = userId;
    }
    console.log("DEBUG [init]: Query", query);

    let chat = await Chat.findOne(query);
    console.log("DEBUG [init]: Found Chat:", chat ? chat.chat_id : "NULL");

    // MIGRATION LOGIC: If logging in, check if we need to migrate an existing anon chat
    if (!chat && chatType === "customer-admin" && anon_customer_id) {
      // User logged in but has no customer chat yet.
      // Check if they had an active anonymous chat
      const anonChat = await Chat.findOne({
        anon_customer_id: anon_customer_id.replace(/['"]/g, ""),
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE",
      });

      if (anonChat) {
        console.log(
          `Migrating anon chat ${anonChat.chat_id} to customer ${userId}`,
        );
        anonChat.customer_id = userId;
        anonChat.chat_type = "customer-admin";
        // We keep the chat_id same, just update attributes
        chat = await anonChat.save();
      }
    }

    let isNewChat = false;
    if (!chat) {
      isNewChat = true;
      const newChatData = {
        chat_id: generateUniqueId("CHAT"),
        chat_type: chatType,
        chat_status: "ACTIVE",
        link_source: source || null,
      };

      if (chatType === "customer-admin") {
        newChatData.customer_id = userId;
      } else {
        newChatData.anon_customer_id = userId;
      }

      chat = await Chat.create(newChatData);
    }

    // If source is provided and chat hasn't been auto-initialised yet
    const normalizedSource = source
      ? source.toString().replace(/['"]/g, "")
      : null;

    // Automation Logic: Trigger greeting if it's a new chat OR a shared link that hasn't been initialised
    const isSharedLink = normalizedSource === "shared_link";

    // Check if chat already has messages to enforce idempotency
    const messageCount = await Message.countDocuments({
      chat_id: chat.chat_id,
    });

    console.log(
      `[FLOW 1] Chat initiated: chat_id=${chat.chat_id}, userId=${userId}, type=${chatType}, source=${source}`,
    );
    console.log(
      `[DEBUG] init chat: userId=${userId}, type=${chatType}, isNew=${isNewChat}, source=${source}, messageCount=${messageCount}`,
    );

    // Trigger greeting flow if:
    // 1. It's a brand new chat (isNewChat)
    // 2. OR it's a shared link and we haven't sent the greeting yet
    // AND there are no messages in the chat yet
    // NOTE: For logged-in users migrating from anon, messageCount might be > 0, so we skip greeting.
    // Trigger greeting flow if chat hasn't been auto-initialised yet
    // We remove other checks to ensure this runs for any first-time initialization
    if (!chat.is_auto_initialised) {
      console.log(
        `[DEBUG] Triggering automated greeting flow for chat_id=${chat.chat_id}`,
      );

      // Mark as auto-initialised immediately to prevent duplicate flows
      chat.is_auto_initialised = true;
      await chat.save();

      // Trigger admin notification immediately (Main Flow)
      try {
        const greetingText = "Hey there! Thanks for choosing Eventory.";

        // Slack Notification
        try {
          await sendSlackAnonChatMessage({
            chatId: chat.chat_id,
            anonCustomerId: userId,
            messageContent: greetingText,
            metadata: { type: "auto_greeting" },
          });
        } catch (slackErr) {
          console.error("Slack notification failed:", slackErr);
        }

        const allEMs = await EventManager.find({});

        if (allEMs.length > 0) {
          const notifications = allEMs.map((em) => ({
            em_id: em.em_id,
            chat_id: chat.chat_id,
            message: `New Chat Started [${userId}]: ${greetingText}...`,
            notification_type: "chat_message",
            timestamp: new Date().toISOString(),
            read: false,
            updated_at: new Date().toISOString(),
          }));

          await EMNotifications.insertMany(notifications);
          console.log(
            `[NOTIFY] Admin notifications sent to ${allEMs.length} EMs.`,
          );

          const fcmResults = await Promise.allSettled(
            allEMs.map((em) =>
              sendFCMNotificationToEm({
                emId: em.em_id,
                priority: "high",
                notification: {
                  title: "New Chat Started",
                  body: `New Chat Started [${userId}]: ${greetingText}...`,
                },
                data: {
                  type: "anon_chat_message_em",
                  chat_id: chat.chat_id,
                  em_id: em.em_id,
                  anon_customer_id: userId,
                  message: `New Chat Started [${userId}]: ${greetingText}...`,
                },
              }),
            ),
          );

          let successCount = 0;
          let failureCount = 0;

          fcmResults.forEach((result, index) => {
            const emId = allEMs[index]?.em_id;
            if (result.status === "fulfilled") {
              successCount++;
              // console.log(`FCM notifications sent to em ${emId}`, result.value);
            } else {
              failureCount++;
              console.error(
                `Failed to send FCM notification to em ${emId}:`,
                result.reason,
              );
            }
          });

          console.log(
            `[FCM] Completed → Success: ${successCount}, Failed: ${failureCount}`,
          );
        }
      } catch (notifErr) {
        console.error(
          "Failed to send admin notification for new chat:",
          notifErr,
        );
      }

      const io = req.io;

      // Start the automated greeting flow
      // 1. Send first message with a small delay (1.5s)
      setTimeout(async () => {
        try {
          const greetingMsg = await Message.create({
            chat_id: chat.chat_id,
            chat_type: chatType,
            sender: "admin",
            sender_id: "admin",
            message_content:
              "Hey there! Welcome to Eventory - your personal event planning companion. Let's get your dream event rolling. It'll only take 2 minutes!",
            message_type: "text",
          });

          console.log(`[FLOW 2] Greeting sent: chat_id=${chat.chat_id}`);
          console.log(
            `[DEBUG] Sent first greeting message: ${greetingMsg._id}`,
          );

          if (io) {
            io.to(`${chat.chat_id}-${chatType}`).emit(
              "new_message",
              greetingMsg.toObject(),
            );
          }
        } catch (err) {
          console.error("Error sending first greeting message:", err);
        }
      }, 500);

      // 2. Delayed second message (3.5 seconds total - 1.5s + 2s)
      setTimeout(async () => {
        try {
          const optionsMsg = await Message.create({
            chat_id: chat.chat_id,
            chat_type: chatType,
            sender: "admin",
            sender_id: "admin",
            message_content: "First things first - what are we celebrating?",
            message_type: "options",
            options: [
              { label: "Birthday", value: "Birthday" },
              { label: "Anniversary", value: "Anniversary" },
              { label: "Social Gathering", value: "Social Gathering" },
              { label: "Corporate Event", value: "Corporate Event" },
              { label: "Something else", value: "Something else" },
            ],
          });

          console.log(
            `[FLOW 3] Event type options sent: chat_id=${chat.chat_id}`,
          );
          console.log(`[DEBUG] Sent second options message: ${optionsMsg._id}`);

          if (io) {
            io.to(`${chat.chat_id}-${chatType}`).emit(
              "new_message",
              optionsMsg.toObject(),
            );
          }
        } catch (err) {
          console.error("Error sending delayed options message:", err);
        }
      }, 2500);
    } else if (messageCount > 0 || chat.is_auto_initialised) {
      // Ensure flag is set if we have messages (sanity check)
      if (!chat.is_auto_initialised) {
        chat.is_auto_initialised = true;
        await chat.save();
      }
    }

    res.status(200).json({
      message: "Chat initialized",
      chat_id: chat.chat_id,
      is_new: isNewChat,
      chat_type: chat.chat_type,
      customer_id: chat.customer_id || null,
    });
  } catch (error) {
    console.error("Error initializing chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendAnonymousMessage = async (req, res) => {
  try {
    let {
      anon_customer_id,
      customer_id,
      message_content,
      message_type,
      attachment_url,
      metadata,
      chat_id,
    } = req.body;

    let sender = "anonymous_customer";
    let sender_id = anon_customer_id;
    let chatType = "anon_customer-admin";

    // Auth Check
    const decodedUser = verifyAuth(req);
    if (decodedUser && customer_id) {
      if (decodedUser.id === customer_id) {
        sender = "customer";
        sender_id = customer_id;
        chatType = "customer-admin";
      } else {
        return res.status(403).json({ error: "Unauthorized sender" });
      }
    }

    // Robust ID normalization
    if (sender_id) sender_id = sender_id.toString().replace(/['"]/g, "");

    if (!sender_id || !message_content) {
      return res
        .status(400)
        .json({
          error:
            "sender_id (anon or customer) and message_content are required",
        });
    }

    let chat;

    // 1. Try to find chat by chat_id if provided
    if (chat_id) {
      // Relaxed: Find by chat_id regardless of type
      chat = await Chat.findOne({ chat_id: chat_id.trim() });
    }

    // 2. If no chat_id or chat not found, try to find ACTIVE chat
    if (!chat) {
      let query = {
        chat_status: "ACTIVE",
      };
      if (sender === "customer") {
        query.chat_type = chatType;
        query.customer_id = sender_id;
      } else {
        // Relaxed for anonymous: Find ANY chat for this anon_id
        query.anon_customer_id = sender_id;
      }

      chat = await Chat.findOne(query);
    }

    // Use the actual chat type if found (e.g. if migrated to customer-admin)
    if (chat) {
      chatType = chat.chat_type;
    }

    let isNewChat = false;

    if (!chat) {
      isNewChat = true;
      let newChatData = {
        chat_id: generateUniqueId("CHAT"),
        chat_type: chatType,
        chat_status: "ACTIVE",
      };
      if (sender === "customer") newChatData.customer_id = sender_id;
      else newChatData.anon_customer_id = sender_id;

      chat = await Chat.create(newChatData);
    }

    const newMessage = await Message.create({
      chat_id: chat.chat_id,
      chat_type: chatType,
      sender: sender,
      sender_id: sender_id,
      message_content,
      message_type: message_type || "text",
      attachment_url: attachment_url || null,
    });

    if (req.io) {
      // DUAL-CAST: Emit to both potential rooms (anon and customer) to ensure
      // frontend receives it regardless of which mode it thinks it is in.
      const roomAnon = `${chat.chat_id}-anon_customer-admin`;
      const roomCust = `${chat.chat_id}-customer-admin`;

      const socketPayload = {
        _id: newMessage._id,
        chat_id: newMessage.chat_id,
        chat_type: newMessage.chat_type,
        sender: newMessage.sender,
        sender_id: newMessage.sender_id,
        message_content: newMessage.message_content,
        message_type: newMessage.message_type,
        message_sent_at: newMessage.message_sent_at,
        attachment_url: newMessage.attachment_url,
        // Include card_data if available (though not in create payload above, robust to add)
        card_data: newMessage.card_data,
      };

      req.io.to(roomAnon).emit("new_message", socketPayload);
      req.io.to(roomCust).emit("new_message", socketPayload);
    }

    // Update chat timestamps
    if (chat.updateLastMessage) {
      await chat.updateLastMessage();
    } else {
      chat.last_message_updated_at = new Date();
      chat.chat_updated_at = new Date();
      await chat.save();
    }

    // Check for previous user messages to determine if we should notify
    // (Notify if it's a new chat OR if this is the first message from the user)
    const previousUserMsg = await Message.findOne({
      chat_id: chat.chat_id,
      sender: { $in: ["customer", "anonymous_customer"] },
      _id: { $ne: newMessage._id }, // Exclude the message we just created
    })
      .select("_id")
      .lean();

    const shouldNotify = isNewChat || !previousUserMsg;

    if (shouldNotify) {
      console.log(
        `[NOTIFY] Triggering admin notification for chat ${chat.chat_id} (New: ${isNewChat}, FirstUserMsg: ${!previousUserMsg})`,
      );
      sendSlackAnonChatMessage({
        chatId: chat.chat_id,
        anonCustomerId: sender_id, // Use generic ID field name in slack util if possible, but keeping for now
        messageContent: message_content,
        metadata,
      });

      // Notify all EMs about the new chat
      try {
        const allEMs = await EventManager.find({}, "em_id");
        if (allEMs.length > 0) {
          const notifications = allEMs.map((em) => ({
            em_id: em.em_id,
            chat_id: chat.chat_id,
            message: `New Chat from [${sender_id}]: ${message_content.substring(0, 30)}...`,
            notification_type: "chat_message",
            timestamp: new Date().toISOString(),
            read: false,
          }));
          await EMNotifications.insertMany(notifications);

          const fcmResults = await Promise.allSettled(
            allEMs.map((em) =>
              sendFCMNotificationToEm({
                emId: em.em_id,
                priority: "high",
                notification: {
                  title: "New Chat Message",
                  body: `New Chat from [${sender_id}]: ${message_content.substring(0, 30)}...`,
                },
                data: {
                  type: "anon_chat_message_em",
                  chat_id: chat.chat_id,
                  em_id: em.em_id,
                  anon_customer_id: sender_id,
                  message: `New Chat from [${sender_id}]: ${message_content.substring(0, 30)}...`,
                },
              }),
            ),
          );

          let successCount = 0;
          let failureCount = 0;

          fcmResults.forEach((result, index) => {
            const emId = allEMs[index]?.em_id;
            if (result.status === "fulfilled") {
              successCount++;
              // console.log(`FCM notifications sent to em ${emId}`, result.value);
            } else {
              failureCount++;
              console.error(
                `Failed to send FCM notification to em ${emId}:`,
                result.reason,
              );
            }
          });

          console.log(
            `[FCM] Completed → Success: ${successCount}, Failed: ${failureCount}`,
          );
        }
      } catch (err) {
        console.error("Failed to create EM notifications for new chat:", err);
      }
    }

    // --- INTERACTIVE FLOW LOGIC ---
    // Only applies if it's an anonymous customer, or if we want to support it for logged in users too.
    // The previous implementation specifically checked for anon_customer-admin.
    // We'll keep it as is, or maybe extend it if needed.
    // --- INTERACTIVE FLOW LOGIC ---
    // Now applies to both anonymous and logged-in customers.
    if (chatType === "anon_customer-admin" || chatType === "customer-admin") {
      console.log(
        `[STAB] Calling handleInteractiveMessage for chat: ${chat.chat_id}, sender: ${sender_id}`,
      );
      await handleInteractiveMessage(
        chat.chat_id,
        sender_id,
        message_content,
        req.io,
      );

      // Update AnonymousUser activity ONLY if it's an anon user
      if (chatType === "anon_customer-admin") {
        await AnonymousUser.findOneAndUpdate(
          { anon_id: sender_id },
          { last_seen_at: new Date() },
        ).catch((err) =>
          console.error("Failed to update anon user activity:", err),
        );
      }
    }

    res.status(201).json({
      message: "Message sent",
      data: newMessage,
      chat_id: chat.chat_id,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages for an anonymous or logged-in customer
export const getAnonymousMessages = async (req, res) => {
  try {
    // This param might contain customer_id if called accordingly,
    // OR we might want to look at query params if the route structure allows.
    // The route is /:anon_customer_id/messages.
    let { anon_customer_id } = req.params;
    const { cursor } = req.query;
    const limit = 20;

    let chatType = "anon_customer-admin";
    let userId = anon_customer_id;

    // Auth Check
    const decodedUser = verifyAuth(req);
    // Only switch to customer-admin if it's NOT an explicit anonymous request
    if (
      decodedUser &&
      (!anon_customer_id || !anon_customer_id.startsWith("ANON"))
    ) {
      // If authenticated, we assume the ID passed in param IS the customer_id
      // OR we just use the ID from the token to be safe.
      // Let's trust the token.
      userId = decodedUser.id;
      chatType = "customer-admin";
    }

    // Robust ID normalization
    if (userId) userId = userId.toString().replace(/['"]/g, "");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find the ACTIVE chat for this user
    // Find the ACTIVE chat for this user
    let chatQuery = {
      chat_status: "ACTIVE",
    };

    if (chatType === "customer-admin") {
      chatQuery.chat_type = chatType;
      chatQuery.customer_id = userId;
    } else {
      // Relaxed for anonymous: Find ANY request for this anon_id
      chatQuery.anon_customer_id = userId;
    }

    // Only get the current active chat.
    // If completed chats exist, we DO NOT show them to start fresh.
    const chat = await Chat.findOne(chatQuery).select("chat_id");

    if (!chat) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    const chatIds = [chat.chat_id];

    let query = {
      chat_id: { $in: chatIds },
      chat_type: { $in: ["anon_customer-admin", "customer-admin"] }, // Fetch all history
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
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get status of the current chat
export const getAnonymousChatStatus = async (req, res) => {
  try {
    let { anon_customer_id } = req.params;
    // Auth Check for Logged in Status
    const decodedUser = verifyAuth(req);
    let userId = anon_customer_id;
    let chatType = "anon_customer-admin";

    // Only switch to customer-admin if it's NOT an explicit anonymous request
    if (
      decodedUser &&
      (!anon_customer_id || !anon_customer_id.startsWith("ANON"))
    ) {
      userId = decodedUser.id;
      chatType = "customer-admin";
    }

    // Robust ID normalization
    if (userId) userId = userId.toString().replace(/['"]/g, "");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let query = {
      chat_status: "ACTIVE",
    };
    if (chatType === "customer-admin") {
      query.chat_type = chatType;
      query.customer_id = userId;
    } else {
      // Relaxed for anonymous: Find ANY active chat
      query.anon_customer_id = userId;
    }

    const chat = await Chat.findOne(query);

    if (chat) {
      res
        .status(200)
        .json({
          status: "ACTIVE",
          chat_id: chat.chat_id,
          em_id: chat.em_id,
          chat_type: chat.chat_type,
        });
    } else {
      // Check if there was a finished chat
      let finishedQuery = {
        chat_status: "FINISHED",
        chat_type: chatType,
      };
      if (chatType === "customer-admin") finishedQuery.customer_id = userId;
      else finishedQuery.anon_customer_id = userId;

      const finishedChat = await Chat.findOne(finishedQuery).sort({
        updatedAt: -1,
      });

      if (finishedChat) {
        res.status(200).json({
          status: "FINISHED",
          chat_id: finishedChat.chat_id,
          em_id: finishedChat.em_id,
          chat_type: finishedChat.chat_type,
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

    let query = {
      chat_type: { $in: ["anon_customer-admin", "customer-admin"] },
    };

    if (search) {
      query.$or = [
        { anon_customer_id: { $regex: search, $options: "i" } },
        { customer_id: { $regex: search, $options: "i" } },
      ];
    }

    const chats = await Chat.find(query)
      .sort({ chat_created_at: -1 })
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
          anon_user_id: chat.customer_id || chat.anon_customer_id,
          created_at: chat.chat_created_at || chat.createdAt,
          last_message: lastMsg ? lastMsg.message_content : "",
          last_message_time: lastMsg
            ? lastMsg.createdAt
            : chat.last_message_updated_at,
          status: chat.chat_status ? chat.chat_status.toLowerCase() : "active",
          chat_type: chat.chat_type,
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

// Get details for a specific anonymous chat by chat_id
export const getAnonymousChatDetails = async (req, res) => {
  try {
    const { chat_id } = req.params;

    if (!chat_id) {
      return res.status(400).json({ error: "chat_id is required" });
    }

    const chat = await Chat.findOne({
      chat_id,
      chat_type: { $in: ["anon_customer-admin", "customer-admin"] },
    }).lean();

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const lastMsg = await Message.findOne({ chat_id: chat.chat_id })
      .sort({ createdAt: -1 })
      .select("message_content createdAt")
      .lean();

    const data = {
      chat_id: chat.chat_id,
      anon_user_id: chat.customer_id || chat.anon_customer_id,
      created_at: chat.chat_created_at || chat.createdAt,
      status: chat.chat_status ? chat.chat_status.toLowerCase() : "active",
      last_message: lastMsg ? lastMsg.message_content : "",
      chat_type: chat.chat_type,
      // metadata: chat.metadata || {}, // If metadata exists on chat model
    };

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching anonymous chat details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset (Finish) the current active chat session
export const resetAnonymousChat = async (req, res) => {
  try {
    let { anon_customer_id, customer_id } = req.body;
    let chatType = "anon_customer-admin";
    let userId = anon_customer_id;

    // Auth Check
    const decodedUser = verifyAuth(req);
    if (decodedUser && customer_id) {
      if (decodedUser.id === customer_id) {
        chatType = "customer-admin";
        userId = customer_id;
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    // Robust ID normalization
    if (userId) userId = userId.toString().replace(/['"]/g, "");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let query = {
      chat_type: chatType,
      chat_status: "ACTIVE",
    };

    if (chatType === "customer-admin") {
      query.customer_id = userId;
    } else {
      query.anon_customer_id = userId;
    }

    const chat = await Chat.findOne(query);

    if (!chat) {
      return res.status(404).json({ message: "No active chat found to reset" });
    }

    chat.chat_status = "FINISHED";
    await chat.save();

    // Also close any unfinished enquiries for this user to ensure fresh start
    let enquiryQuery = { status: { $nin: ["CLOSED", "CONVERTED"] } };
    if (chatType === "customer-admin") {
      enquiryQuery.customer_id = userId;
    } else {
      enquiryQuery.anon_customer_id = userId;
    }

    await CustomerEnquiry.updateMany(enquiryQuery, { status: "CLOSED" });
    console.log(`[RESET] Closed active enquiries for user: ${userId}`);

    res
      .status(200)
      .json({ message: "Chat reset successfully", chat_id: chat.chat_id });
  } catch (error) {
    console.error("Error resetting chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
