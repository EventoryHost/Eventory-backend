import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatId: { type: String, required: true }, // Reference to Chat room ID
    senderType: { type: String, required: true, enum: ["cus", "ven", "rm"] }, // Any of the 3 users
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
