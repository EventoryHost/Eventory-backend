import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    cusId: { type: String, required: true },
    serId: { type: String, required: true },
    venId: { type: String, required: true },
    rmId: { type: String, required: true },
    chatType: { 
      type: String, 
      required: true, 
      enum: ["vendor-admin", "customer-admin"],
    },
    status: { type: String, default: "active", enum: ["active", "blocked"] },
    pinnedMessages: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Chat", chatSchema);
