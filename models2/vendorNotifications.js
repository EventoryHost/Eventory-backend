import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Vendor Notifications Schema according to ERD only
const vendorNotificationsSchema = new Schema({
  service_id: {
    type: String,
    required: true
  },
  event_id: {
    type: String
  },
  order_id: {
    type: String
  },
  chat_id: {
    type: String
  },
  vendor_id: {
    type: String,
    required: true
  },
  quotation_id: {
    type: String
  },
  booking_id: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
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
  updated_at: {
    type: String, // Changed to String to match ERD timestamp format
    default: () => new Date().toISOString()
  }
}, {
  timestamps: true,
  collection: 'vendor_notifications'
});

// Indexes for better performance
vendorNotificationsSchema.index({ service_id: 1, read: 1 });
vendorNotificationsSchema.index({ order_id: 1 });
vendorNotificationsSchema.index({ chat_id: 1 });
vendorNotificationsSchema.index({ updated_at: -1 });

// Pre-save middleware
vendorNotificationsSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date().toISOString();
  }
  next();
});

// Check if model already exists to prevent OverwriteModelError
const VendorNotifications = mongoose.models.VendorNotifications || 
  mongoose.model('VendorNotifications', vendorNotificationsSchema);

export default VendorNotifications;
export { vendorNotificationsSchema };
