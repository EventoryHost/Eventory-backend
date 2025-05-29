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

    socket.on("send_message", async ({ chatId, senderType, content, contentType, mediaUrl, clientMessageId }) => {
        try {
            // Skip empty content or null/undefined values
            if (!content || content.trim() === '') {
                content = ''; // Set to empty string if undefined/null
            }

            // Always perform both checks independently
            const hasAbusiveLanguage = checkPhoneNumber(content);
            const hasPhoneNumber = checkProfanity(content);

            // Return early with specific error messages
            if (hasAbusiveLanguage) {
                socket.emit("error", "Please refrain from using abusive words!");
                return;
            }

            if (hasPhoneNumber) {
                socket.emit("error", "Please refrain from sharing personal information!");
                return;
            }

            // Continue with the rest of the function if checks pass
            const chat = await Chat.findOne({ chatId });
            if (!chat) {
                socket.emit("error", "Invalid chatId");
                return;
            }

            const validSenders = ["cus", "ven", "rm"];
            const validContentTypes = ["text", "image", "video", "pdf", "file"];
            
            if (!validContentTypes.includes(contentType)) {
                contentType = "text"; // Default to text if not specified
            }
            
            if (!validSenders.includes(senderType)) {
                socket.emit("error", "Invalid sender type");
                return;
            }

            // Create and save message with content type and media URL
            const message = new Message({ 
                chatId, 
                senderType, 
                content, 
                contentType,
                mediaUrl: mediaUrl || null
            });
            
            await message.save();

            // Emit to everyone in the room with full message data
            socket.to(chatId).emit("new_message", {
                chatId,
                senderType,
                content,
                contentType,
                mediaUrl: mediaUrl || null,
                timestamp: message.createdAt,
            });

            console.log(`📤 ${senderType} sent ${contentType} message in chat ${chatId}`);
        } catch (err) {
            console.error("send_message error:", err);
            socket.emit("error", "Error sending message");
        }
    });

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
            .limit(limit + 1); 

        let hasMore = false;
        let nextCursor = null;

        if (messages.length > limit) {
            hasMore = true;
            nextCursor = messages[limit]._id;
        }

        // Slice to return only the first 15
        const resultMessages = messages.slice(0, limit);

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

