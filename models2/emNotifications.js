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
    // required: true,
    unique: true
  },
  event_id: {
    type: String,
  },
  chat_id: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
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
  },
  notification_type: {
    type: String,
    required: true,
    enum: ['chat_message', 'checkout_message', "message_reminder" ]
  },
}, {
  timestamps: true,
  collection: 'em_notifications'
});

// Indexes for better performance
emNotificationsSchema.index({ em_id: 1, read: 1 });
emNotificationsSchema.index({ chat_id: 1 });
emNotificationsSchema.index({ updated_at: -1 });

// Pre-save middleware
emNotificationsSchema.pre('save', function(next) {
  this.updated_at = new Date().toISOString();
  next();
});

// Check if model already exists to prevent OverwriteModelError
const EMNotifications = mongoose.models.EMNotifications || mongoose.model('EMNotifications', emNotificationsSchema);

export default EMNotifications;
