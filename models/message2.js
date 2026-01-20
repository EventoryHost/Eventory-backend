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
      enum: ["vendor-admin", "customer-admin", "anon_customer-admin","vendor-enquiry"], 
    },
    sender: {
      type: String,
      enum: ["customer", "vendor", "em", "anonymous_customer", "admin"],
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
        "vendor_card",
        "options",
        "order_summary",
        "login_prompt",
        "review_prompt"
      ],
      required: true,
      default: "text",
    },
    message_content: {
      type: String,
      required: true,
    },
    // For interactive messages (buttons)
    options: [{
      label: String,
      value: String
    }],
    // For specific actions (e.g., "request_review", "login_prompt")
    action: {
      type: String
    },
    // For rich cards (vendor details, order summary)
    card_data: {
      type: mongoose.Schema.Types.Mixed
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
      ref: "Message",
    },
    is_edited: {
      type: Boolean,
      default: false,
    },
    edited_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "Message",
  }
);

// Indexes for better performance
messageSchema.index({ chat_id: 1, message_sent_at: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ parent_message_id: 1 });

// Check if model already exists to prevent OverwriteModelError
const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
