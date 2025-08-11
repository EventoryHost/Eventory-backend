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
// order_id already has unique index, no need for additional index
customerNotificationSchema.index({ chat_id: 1 });
customerNotificationSchema.index({ read: 1 });
customerNotificationSchema.index({ updated_at: -1 });

// Compound indexes
customerNotificationSchema.index({ customer_id: 1, read: 1 });
customerNotificationSchema.index({ customer_id: 1, updated_at: -1 });

// Method to mark notification as read
customerNotificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.updated_at = new Date();
  return this.save();
};

// Method to mark notification as unread
customerNotificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.updated_at = new Date();
  return this.save();
};

// Method to update message content
customerNotificationSchema.methods.updateMessage = function(newMessage) {
  this.message = newMessage;
  this.updated_at = new Date();
  return this.save();
};

// Method to update checkout URL
customerNotificationSchema.methods.updateCheckoutUrl = function(newUrl) {
  this.checkout_url = newUrl;
  this.updated_at = new Date();
  return this.save();
};

// Static method to get unread count for customer
customerNotificationSchema.statics.getUnreadCount = function(customerId) {
  return this.countDocuments({ customer_id: customerId, read: false });
};

// Static method to get notifications for customer with pagination
customerNotificationSchema.statics.getCustomerNotifications = function(customerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ customer_id: customerId })
    .sort({ updated_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('order_id')
    .populate('chat_id')
    .populate('service_id');
};

// Static method to mark all notifications as read for a customer
customerNotificationSchema.statics.markAllAsReadForCustomer = function(customerId) {
  return this.updateMany(
    { customer_id: customerId, read: false },
    { 
      read: true, 
      updated_at: new Date() 
    }
  );
};

// Pre-save middleware to update timestamp when read status changes
customerNotificationSchema.pre('save', function(next) {
  if (this.isModified('read') || this.isModified('message') || this.isModified('checkout_url')) {
    this.updated_at = new Date();
  }
  next();
});

const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);

export { CustomerNotification };
export default CustomerNotification;
