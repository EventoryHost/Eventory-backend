import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;


// Vendor Model based on ERD
const vendorSchema = new Schema({
  vendor_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("VEN")
  },
  vendor_mobile: {
    type: String,
    required: true
  },
  email_address: {
    type: String
  },
  profile_picture: {
    type: String
  },
  services: [{
    type: String
  }],
  // Stores data of service types provided by the vendor
  service_types: [{
    service_name: {
      type: String,
      required: true
    },
    service_id: {
      type: String,
    },
    service_status: {
      type: String,
      required: true,
      default : "Inactive"
  }
  }, {_id: false}],
  coupons_used: [{
    type: String
  }],
  highest_discount_ever_applied: {
    type: Number,
    default: 0,
    min: 0
  },
  vendor_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  vendor_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  last_coupon_used_at: {
    type: Date,
    default: null
  }
}, {
  collection: 'vendors'
});

// Pre-save middleware to update vendor_updated_at on every save
vendorSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.vendor_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

// Pre-update middleware to update vendor_updated_at on updates
vendorSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ vendor_updated_at: new Date(now.getTime() + istOffset) });
  next();
});

// Method to update last_coupon_used_at when a coupon is used
vendorSchema.methods.useCoupon = function(couponCode) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  this.coupons_used.push(couponCode);
  this.last_coupon_used_at = new Date(now.getTime() + istOffset);
  
  return this.save();
};

// Add indexes for the new timestamp fields
vendorSchema.index({ vendor_created_at: -1 });
vendorSchema.index({ vendor_updated_at: -1 });
vendorSchema.index({ last_coupon_used_at: -1 });
vendorSchema.index({ vendor_mobile: 1 });
vendorSchema.index({ email_address: 1 });

const Vendor = model("Vendor", vendorSchema);

export { 
  Vendor, 
  vendorSchema
};
