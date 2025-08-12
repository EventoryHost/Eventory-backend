import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

// Customer Notifications Schema according to ERD
const customerNotificationSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true
    // CUSTYYYYMMDDhhmmss
  },
  order_id: {
    type: String,
    required: true,
    unique: true
    // Order ID for which the notification is created
  },
  event_id: {
    type: String,
    required: false
  },
  chat_id: {
    type: String,
    required: false
    // Chat ID
  },
  notification_type: {
    type: String,
    required: true,
    enum: ['chat_message', 'checkout_message']
  },
  message: {
    type: String,
    required: true // Message content
  },
  final_amount: {
    type: Number, // Long -> Number in mongoose (Final Bill for the customer)
    required: false
  },
  checkout_url: {
    type: String,
    required: false // Link to redirect to checkout (embedded in a button)
  },
  read: {
    type: Boolean,
    default: false,
    required: true // Message has been opened or not
  },
  updated_at: {
    type: String,
    default: () => new Date().toISOString() // timestamp for which the status has been updated. (when created, when opened)
  }
}, {
  timestamps: true,
  collection: 'customer_notifications'
});

// Indexes for better performance
customerNotificationSchema.index({ customer_id: 1 });
customerNotificationSchema.index({ chat_id: 1 });
customerNotificationSchema.index({ read: 1 });
customerNotificationSchema.index({ updated_at: -1 });

// Compound indexes
customerNotificationSchema.index({ customer_id: 1, read: 1 });
customerNotificationSchema.index({ customer_id: 1, updated_at: -1 });

// Pre-save middleware to update timestamp when read status changes
customerNotificationSchema.pre('save', function(next) {
  if (this.isModified('read') || this.isModified('message') || this.isModified('checkout_url')) {
    this.updated_at = new Date().toISOString();
  }
  next();
});

const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);

export { CustomerNotification };
export default CustomerNotification;
