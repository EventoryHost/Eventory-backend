import Chat from "../models/chat.js";
import Message from "../models/message.js";
import APIFeatures from "../utils/apiFeatures.js";

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

    socket.on("send_message", async ({ chatId, senderType, content }) => {
        try {
            const chat = await Chat.findOne({ chatId });
            if (!chat) {
                socket.emit("error", "Invalid chatId");
                return;
            }

            const validSenders = ["cus", "ven", "rm"];
            if (!validSenders.includes(senderType)) {
                socket.emit("error", "Invalid sender type");
                return;
            }

            const message = new Message({ chatId, senderType, content });
            await message.save();

            // Emit to everyone in the room
            socket.to(chatId).emit("new_message", {
                chatId,
                senderType,
                content,
                timestamp: message.createdAt,
            });

            console.log(`📤 ${senderType} sent message in chat ${chatId}`);
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
    const queryOptions = { ...req.query }; // allows dynamic pagination, sorting, etc.
    queryOptions["limit"] = parseInt(queryOptions.limit) || 15; // default limit to 15 if not specified
    
    try {
        const features = new APIFeatures(
            // Return messages in descending order (newest first)
            // This way we'll get the most recent messages in each page
            Message.find({ chatId }).sort({ createdAt: -1 }), 
            queryOptions
        )
            .sort()
            .limitFields()
            .paginate();

        const messages = await features.query;

        const total = await Message.countDocuments({ chatId });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(queryOptions.limit) || 15;

        res.status(200).json({
            messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: (page - 1) * limit + messages.length < total,
        });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};