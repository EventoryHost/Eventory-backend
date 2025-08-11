import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// EM Notifications Schema according to ERD
const emNotificationsSchema = new Schema({
  em_id: {
    type: String,
    required: true
  },
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  chat_id: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false,
    required: true
  },
  updated_at: {
    type: String,
    default: () => new Date().toISOString(),
    required: true
  }
}, {
  timestamps: true,
  collection: 'em_notifications'
});

// Indexes for better performance
emNotificationsSchema.index({ em_id: 1, read: 1 });
emNotificationsSchema.index({ chat_id: 1 });
emNotificationsSchema.index({ updated_at: -1 });

// Virtual for getting time ago
emNotificationsSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.updated_at;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Instance methods
emNotificationsSchema.methods.markAsRead = function() {
  this.read = true;
  this.updated_at = new Date();
  return this.save();
};

emNotificationsSchema.methods.markAsUnread = function() {
  this.read = false;
  this.updated_at = new Date();
  return this.save();
};

// Static methods
emNotificationsSchema.statics.getUnreadCount = function(emId) {
  return this.countDocuments({ em_id: emId, read: false });
};

emNotificationsSchema.statics.getNotificationsByEM = function(emId, options = {}) {
  const { limit = 20, read } = options;
  
  let query = { em_id: emId };
  if (read !== undefined) {
    query.read = read;
  }
  
  return this.find(query)
    .sort({ updated_at: -1 })
    .limit(limit);
};

emNotificationsSchema.statics.markAllAsRead = function(emId) {
  return this.updateMany(
    { em_id: emId, read: false },
    { read: true, updated_at: new Date() }
  );
};

// Pre-save middleware
emNotificationsSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Check if model already exists to prevent OverwriteModelError
const EMNotifications = mongoose.models.EMNotifications || mongoose.model('EMNotifications', emNotificationsSchema);

export default EMNotifications;
