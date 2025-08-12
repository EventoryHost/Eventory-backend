import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Common Bank Details Schema for reuse across all service models
const bankDetailsSchema = new Schema({
  vendor_id: {
    type: String,
    required: true // Added to match ERD
  },
  service_id: {
    type: String,
    required: true // Added to match ERD
  },
  bank_name: {
    type: String
  },
  account_type: {
    type: String,
    required: true
  },
  account_number: {
    type: String
  },
  ifsc: {
    type: String
  },
  bank_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  bank_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, { _id: false });


// Common Business Details Schema for reuse across all service models
const businessDetailsSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true
  },
  service_type: {
    type: String,
    required: true
  },
  category: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  business_registration_name: {
    type: String,
    required: true,
    trim: true
  },
  gst: {
    type: String,
    required: false,
    default: null
  },
  pan: {
    type: String,
    required: false,
    default: null
  },
  verification_type: {
    type: String,
    required: true,
    enum: ['GSTIN', 'PAN']
  },
  team_size: {
    type: Number,
    required: true,
    min: 1
  },
  years_of_operation: {
    type: Number,
    required: true,
    min: 0
  },
  business_address: {
    type: String,
    required: true,
    trim: true
  },
  landmark: {
    type: String,
    required: false
  },
  pincode: {
    type: Number, // Changed from Long to Number to match ERD
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(String(v));
      },
      message: 'Pincode must be a 6-digit number'
    }
  },
  operational_cities: [{
    type: String,
    required: true
  }],
  annual_revenue: {
    type: String,
    required: false
  },
  annual_bookings: {
    type: Number, // Changed from Int to Number
    required: true,
    min: 0
  },
  business_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  business_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, { _id: false });


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
    required: false,
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

// Service Location Schema for reuse across different service models
const serviceLocationSchema = new Schema({
  lat: {
    type: String,
    required: false
  },
  lon: {
    type: String,
    required: false
  },
  service_pincode: {
    type: Number,
    required: false,
    validate: {
      validator: function(v) {
        if (v === undefined || v === null) return true;
        return /^\d{6}$/.test(String(v));
      },
      message: 'Service pincode must be a 6-digit number'
    }
  },
  google_map_link: {
    type: String,
    required: false
  }
}, { _id: false });

// Policies Schema for reuse across different service models
const policiesSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  cancellation_policy: {
    type: String,
    required: false
  },
  terms_and_conditions: {
    type: String,
    required: false
  },
  agreement_url: {
    type: String,
    required: true
  },
  agreement_signed_at: {
    type: Date,
    required: true
  }
}, { _id: false });

// Add indexes for the new timestamp fields
vendorSchema.index({ vendor_created_at: -1 });
vendorSchema.index({ vendor_updated_at: -1 });
vendorSchema.index({ last_coupon_used_at: -1 });
vendorSchema.index({ vendor_mobile: 1 });
vendorSchema.index({ email_address: 1 });

const Vendor = model("Vendor", vendorSchema);

export { 
  Vendor, 
  vendorSchema, 
  serviceLocationSchema, 
  policiesSchema,
  bankDetailsSchema,
  businessDetailsSchema
};
