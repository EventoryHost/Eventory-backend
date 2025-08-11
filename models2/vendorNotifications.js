import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Vendor Notifications Schema according to ERD only
const vendorNotificationsSchema = new Schema({
  service_id: {
    type: String,
    required: true
  },
  order_id: {
    type: String,
    required: false
  },
  chat_id: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
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
