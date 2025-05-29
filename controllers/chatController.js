import { checkProfanity } from "../middlewares/checkPhoneNumber.js";
import { checkPhoneNumber } from "../middlewares/checkProfanity.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import APIFeatures from "../utils/apiFeatures.js";
import mongoose from "mongoose";

export const handleSocketConnection = (socket, io) => {
    console.log(`🧠 Socket connected: ${socket.id}`);

    socket.on("join_chat", async ({ chatId, userType }) => {
        try {
            const chat = await Chat.findOne({ chatId });

            if (!chat) {
                socket.emit("error", "Chat room does not exist");
                return;
            }

            socket.join(chatId);
            socket.emit("joined", `Joined chat room ${chatId}`);
            console.log(`${userType} joined chat room: ${chatId}`);
        } catch (err) {
            console.error("join_chat error:", err);
            socket.emit("error", "Error joining chat");
        }
    });

    socket.on("send_message", async ({ chatId, senderType, content, contentType, mediaUrl, parentId, parentContent, parentContentType }) => {
    try {
        if (checkProfanity(content)) {
            socket.emit("error", "Please refrain from using abusive words!");
            return; // Prevent sending
        }

        if (checkPhoneNumber(content)) {
            socket.emit("error", "Please refrain from sharing personal information!");
            return; // Prevent sending
        }

        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            socket.emit("error", "Invalid chatId");
            return;
        }

        if (chat.status === "blocked") {
            socket.emit("error", "This chat is blocked. You cannot send messages.");
            return;
        }

        const validSenders = ["cus", "ven", "rm"];
        const validContentTypes = ["text", "image", "video", "pdf", "file"];

        if (!validSenders.includes(senderType)) {
            socket.emit("error", "Invalid sender type");
            return;
        }

        if (!validContentTypes.includes(contentType)) {
            contentType = "text"; // Default to text
        }

        const message = new Message({
            chatId,
            senderType,
            content,
            contentType,
            mediaUrl: mediaUrl || null,
            parent: parentId,
        });

        await message.save();

        socket.to(chatId).emit("new_message", {
            chatId,
            senderType,
            content,
            contentType,
            parentId,
            parentContent,
            parentContentType,
            mediaUrl: mediaUrl || null,
            timestamp: message.createdAt,
        });

        console.log(`📤 ${senderType} sent ${contentType} message in chat ${chatId}`);
    } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", "Error sending message");
    }});


    socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
    });
};

export const getMessagesByChatId = async (req, res) => {
  const { chatId } = req.params;
  const { cursor } = req.query;
  const limit = 15;

  try {
    let query = { chatId };

    if (cursor) {
      query._id = { $lte: new mongoose.Types.ObjectId(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({ path: "parent", select: "content" }) 
      .lean();

    let hasMore = false;
    let nextCursor = null;

    if (messages.length > limit) {
      hasMore = true;
      nextCursor = messages[limit]._id;
    }

    const resultMessages = messages.slice(0, limit);

    // Add parentText field from populated parent
    resultMessages.forEach(msg => {
      if (msg.parent && typeof msg.parent === "object") {
        msg.parentText = msg.parent.content;
        msg.parent = msg.parent._id; // optionally keep parent as ID
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
    const { chatId } = req.params;
    const { q } = req.query; 

    if (!q || !chatId) {
        return res.status(400).json({ error: "Query (q) and chatId are required" });
    }

    try {
        const messages = await Message.find({
            chatId,
            content: { $regex: q, $options: "i" }, 
        }).sort({ createdAt: -1 });

        res.status(200).json({ messages });
    } catch (err) {
        console.error("Error searching messages:", err);
        res.status(500).json({ error: "Failed to search messages" });
    }
};

export const getMessageContext = async (req, res) => {
    const { chatId, qId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(qId)) {
        return res.status(400).json({ error: "Invalid messageId (qId)" });
    }

    try {
        const currentMessage = await Message.findOne({ _id: qId, chatId });
        if (!currentMessage) {
            return res.status(404).json({ error: "Message not found in the given chat" });
        }

        const olderMessages = await Message.find({
            chatId,
            _id: { $lt: new mongoose.Types.ObjectId(qId) },
        })
            .sort({ _id: -1 })
            .limit(20);

        const newerMessages = await Message.find({
            chatId,
            _id: { $gt: new mongoose.Types.ObjectId(qId) },
        })
            .sort({ _id: 1 })
            .limit(15);

        const result = [
            ...olderMessages.reverse(),  
            currentMessage,
            ...newerMessages             
        ];

        res.status(200).json({ messages: result });
    } catch (err) {
        console.error("Error fetching message context:", err);
        res.status(500).json({ error: "Failed to fetch message context" });
    }
};

export const uploadChatMedia = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileKey = req.file.key; // This is the path inside S3 bucket
  const cloudFrontUrl = `https://d1u34m45xfa3ar.cloudfront.net/${fileKey}`;
  
  // Determine content type based on mime type
  let contentType = "file";
  const mimeType = req.file.mimetype || "";
  
  if (mimeType.startsWith('image/')) {
    contentType = "image";
  } else if (mimeType.startsWith('video/')) {
    contentType = "video";
  } else if (mimeType === 'application/pdf') {
    contentType = "pdf";
  }

  return res.status(200).json({
    message: "File uploaded successfully",
    url: cloudFrontUrl,
    contentType: contentType,
    originalName: req.file.originalname
  });
};

export const pinMessageInChat = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    if (!chatId || !messageId) {
      return res.status(400).json({ error: "chatId and messageId are required" });
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.pinnedMessages.includes(messageId)) {
      chat.pinnedMessages.push(messageId);
      await chat.save();
    }

    return res.status(200).json({ message: "Message pinned successfully", pinnedMessages: chat.pinnedMessages });

  } catch (error) {
    console.error("Couldn't pin chat:", error);
    return res.status(500).json({ error: "Could not pin chat" });
  }
};

export const unpinMessageInChat = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.pinnedMessages = chat.pinnedMessages.filter(id => id !== messageId);
    await chat.save();

    return res.status(200).json({ message: "Message unpinned successfully", pinnedMessages: chat.pinnedMessages });

  } catch (error) {
    console.error("Couldn't unpin chat:", error);
    return res.status(500).json({ error: "Could not unpin chat" });
  }
};

export const blockChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.status === "blocked") {
      return res.status(200).json({ message: "Chat is already blocked" });
    }

    chat.status = "blocked";
    await chat.save();

    return res.status(200).json({ message: "Chat blocked successfully", chat });

  } catch (error) {
    console.error("Couldn't block chat:", error);
    return res.status(500).json({ error: "Could not block chat" });
  }
};

export const unblockChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.status === "active") {
      return res.status(200).json({ message: "Chat is already active" });
    }

    chat.status = "active";
    await chat.save();

    return res.status(200).json({ message: "Chat unblocked successfully", chat });

  } catch (error) {
    console.error("Couldn't unblock chat:", error);
    return res.status(500).json({ error: "Could not unblock chat" });
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

