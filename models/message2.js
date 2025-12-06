import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Message Schema according to ERD
const messageSchema = new Schema(
  {
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true, // MongoDB will auto-generate ObjectId
      required: true,
    },
    chat_id: {
      type: String,
      required: true,
    },
    chat_type: { 
      type: String, 
      required: true, 
      enum: ["vendor-admin", "customer-admin"] 
    },
    sender: {
      type: String,
      enum: ["customer", "vendor", "em"],
      required: true,
    },
    sender_id: {
      type: String,
      required: true, 
    },
    message_type: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "pdf",
        "file",
        "approval_request",
        "order",
        "system",
      ],
      required: true,
      default: "text",
    },
    message_content: {
      type: String,
      required: true,
    },
    attachment_url: {
      type: String,
    },
    message_sent_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    parent_message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message2",
    },
  },
  {
    timestamps: true,
    collection: "Message2",
  }
);

// Indexes for better performance
messageSchema.index({ chat_id: 1, message_sent_at: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ parent_message_id: 1 });

// Check if model already exists to prevent OverwriteModelError
const Message2 =
  mongoose.models.Message2 || mongoose.model("Message2", messageSchema);
export default Message2;
