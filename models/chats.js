import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Chat Schema
const chatSchema = new Schema({
  chat_id: {
    type: String,
    required: true,
    default: () => generateUniqueId("CHAT")
  },
  anon_customer_id: {
    type: String,
    required: false
  },
  service_id: {
    type: String,
    required: false
  },
  customer_id: {
    type: String,
    required: false
  },
  vendor_id: {
    type: String,
    required: false
  },
  em_id: {
    type: String
  },
  chat_type: {
    type: String,
    required: true,
    enum: ["vendor-admin", "customer-admin", "anon_customer-admin", "vendor-enquiry"]
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
    default: () => new Date()
  },
  chat_started_at: {
    type: Date,
    default: () => new Date()
  },
  chat_created_at: {
    type: Date,
    default: () => new Date()
  },
  chat_updated_at: {
    type: Date,
    default: () => new Date()
  },
  link_source: {
    type: String,
    required: false
  },
  is_auto_initialised: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'chat2'
});

// Pre-save middleware to update chat_updated_at and last_message_updated_at on every save
chatSchema.pre('save', function (next) {
  const now = new Date();

  if (!this.isNew) {
    this.chat_updated_at = now;
  }

  // Update last_message_updated_at when the document is modified (excluding new documents)
  if (this.isModified() && !this.isNew) {
    this.last_message_updated_at = now;
  }

  next();
});

// Pre-update middleware to update chat_updated_at on updates
chatSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const now = new Date();

  this.set({ chat_updated_at: now });

  // Also update last_message_updated_at for update operations
  this.set({ last_message_updated_at: now });

  next();
});

// Method to update last_message_updated_at when a new message is added
chatSchema.methods.updateLastMessage = function () {
  const now = new Date();

  this.last_message_updated_at = now;
  this.chat_updated_at = now;

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
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
