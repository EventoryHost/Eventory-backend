import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true }, // Reference to Chat room ID
    senderType: { type: String, required: true, enum: ["cus", "ven", "rm"] }, // Any of the 3 users
    contentType: {
      type: String,
      required: true,
      enum: ["text", "image", "video", "pdf", "file"],
    }, // Type of content
    content: { type: String, required: true },
    mediaUrl: { type: String, default: null }, // URL to media file if applicable
    timestamp: { type: Date, default: Date.now },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: -1, _id: -1 });

export default mongoose.model("Message", messageSchema);
