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
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // Remove to avoid redundancy with updated_at
  collection: 'vendor_notifications'
});

// Indexes for better performance
vendorNotificationsSchema.index({ service_id: 1, read: 1 });
vendorNotificationsSchema.index({ order_id: 1 });
vendorNotificationsSchema.index({ chat_id: 1 });
vendorNotificationsSchema.index({ updated_at: -1 });

// Virtual for getting time ago (using updated_at instead of createdAt)
vendorNotificationsSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.updated_at;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return this.updated_at.toLocaleDateString();
});

// Instance methods (only using existing fields)
vendorNotificationsSchema.methods.markAsRead = function() {
  this.read = true;
  this.updated_at = new Date();
  return this.save();
};

vendorNotificationsSchema.methods.markAsUnread = function() {
  this.read = false;
  this.updated_at = new Date();
  return this.save();
};

// Static methods (only using existing fields)
vendorNotificationsSchema.statics.findByService = function(serviceId) {
  return this.find({ service_id: serviceId }).sort({ updated_at: -1 });
};

vendorNotificationsSchema.statics.findUnreadByService = function(serviceId) {
  return this.find({ 
    service_id: serviceId, 
    read: false 
  }).sort({ updated_at: -1 });
};

vendorNotificationsSchema.statics.markAllAsRead = function(serviceId) {
  return this.updateMany(
    { service_id: serviceId, read: false },
    { 
      read: true, 
      updated_at: new Date() 
    }
  );
};

vendorNotificationsSchema.statics.getUnreadCount = function(serviceId) {
  return this.countDocuments({ 
    service_id: serviceId, 
    read: false 
  });
};

// Pre-save middleware
vendorNotificationsSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

// Check if model already exists to prevent OverwriteModelError
const VendorNotifications = mongoose.models.VendorNotifications || 
  mongoose.model('VendorNotifications', vendorNotificationsSchema);

export default VendorNotifications;
export { vendorNotificationsSchema };
