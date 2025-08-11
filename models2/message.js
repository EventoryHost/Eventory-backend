import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Message Schema according to ERD
const messageSchema = new Schema({
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true, // MongoDB will auto-generate ObjectId
    required: true
  },
  chat_id: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['customer', 'vendor', 'em'],
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'video', 'pdf', 'file', 'approval_request', 'order'],
    required: true,
    default: 'text'
  },
  message_content: {
    type: String,
    required: true
  },
  attachment_url: {
    type: String,
    required: false
  },
  message_sent_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  parent_message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: false
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Indexes for better performance
messageSchema.index({ chat_id: 1, message_sent_at: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ parent_message_id: 1 });

// Instance methods
messageSchema.methods.isReply = function() {
  return !!this.parent_message_id;
};

messageSchema.methods.hasAttachment = function() {
  return !!this.attachment_url;
};

// Static methods
messageSchema.statics.getMessagesByChat = function(chatId, options = {}) {
  const { limit = 50, before, after } = options;
  
  let query = { chat_id: chatId };
  
  if (before) {
    query.message_sent_at = { $lt: new Date(before) };
  } else if (after) {
    query.message_sent_at = { $gt: new Date(after) };
  }
  
  return this.find(query)
    .populate('parent_message_id', 'message_content sender')
    .sort({ message_sent_at: -1 })
    .limit(limit);
};

messageSchema.statics.getMessageThread = function(messageId) {
  return this.find({
    $or: [
      { parent_message_id: messageId },
      { _id: messageId }
    ]
  }).sort({ message_sent_at: 1 });
};

// Check if model already exists to prevent OverwriteModelError
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
