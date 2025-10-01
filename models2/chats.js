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
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  chat_started_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  chat_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  chat_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'chats'
});

// Pre-save middleware to update chat_updated_at and last_message_updated_at on every save
chatSchema.pre('save', function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  if (!this.isNew) {
    this.chat_updated_at = istTime;
  }
  
  // Update last_message_updated_at when the document is modified (excluding new documents)
  if (this.isModified() && !this.isNew) {
    this.last_message_updated_at = istTime;
  }
  
  next();
});

// Pre-update middleware to update chat_updated_at on updates
chatSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  this.set({ chat_updated_at: istTime });
  
  // Also update last_message_updated_at for update operations
  this.set({ last_message_updated_at: istTime });
  
  next();
});

// Method to update last_message_updated_at when a new message is added
chatSchema.methods.updateLastMessage = function() {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  this.last_message_updated_at = new Date(now.getTime() + istOffset);
  this.chat_updated_at = new Date(now.getTime() + istOffset);
  
  return this.save();
};

// Indexes for better performance
chatSchema.index({ service_id: 1, customer_id: 1 });
chatSchema.index({ vendor_id: 1, chat_status: 1 });
chatSchema.index({ last_message_updated_at: -1 });
chatSchema.index({ chat_created_at: -1 });
chatSchema.index({ chat_updated_at: -1 });
chatSchema.index({ chat_started_at: -1 });

// Check if model already exists to prevent OverwriteModelError
const Chat2 = mongoose.models.Chat || mongoose.model('Chat2', chatSchema);

export default Chat2;
