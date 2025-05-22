import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    cusId: { type: String, required: true },
    serId: { type: String, required: true },
    venId: { type: String, required: true },
    rmId: { type: String, required: true },
}, { timestamps: true });
    
export default mongoose.model("Chat", chatSchema);
