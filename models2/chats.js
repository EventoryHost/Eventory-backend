import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Chat Schema
const chatSchema = new Schema({
  chat_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("CHAT")
  },
  service_id: {
    type: String,
    required: true
  },
  customer_id: {
    type: String,
    required: true
  },
  vendor_id: {
    type: String,
    required: true
  },
  em_id: {
    type: String
  },
  chat_status: {
    type: String,
    enum: ['ACTIVE', 'BLOCKED', 'FINISHED'],
    default: 'ACTIVE',
    required: true
  },
  pinned_chat_messages: {
    type: [String], // Array of Message Object IDs
    default: []
  },
  last_message_updated_at: {
    type: Date,
    default: Date.now
  },
  chat_started_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Indexes for better performance
chatSchema.index({ service_id: 1, customer_id: 1 });
chatSchema.index({ vendor_id: 1, chat_status: 1 });
chatSchema.index({ last_message_updated_at: -1 });

// Pre-save middleware to update last_message_updated_at
chatSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.last_message_updated_at = new Date();
  }
  next();
});

// Check if model already exists to prevent OverwriteModelError
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
