import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Common Bank Details Schema for reuse across all service models
const bankDetailsSchema = new Schema({
  bank_name: {
    type: String,
    required: false
  },
  account_type: {
    type: String,
    required: false,
    enum: ['Savings', 'Current'],
    default: null
  },
  account_number: {
    type: String,
    required: false
  },
  ifsc: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty/null values
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: 'IFSC code must be in the format: 4 letters, 0, and 6 alphanumeric characters'
    }
  },
  is_completed: {
    type: Boolean,
    default: false
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
    required: true,
    enum: ['Venue', 'Caterer', 'Decorator', 'Photographer', 'Makeup_Artist']
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
    enum: ['gst', 'pan']
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
    type: Number,
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
    type: Number,
    required: true,
    min: 0
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
  wa_mobile: {
    type: String,
    required: true,
    unique: true
  },
  email_address: {
    type: String,
    required: false
  },
  profile_picture: {
    type: String,
    required: false
  },
  services: [{
    type: String,
    required: false
  }],
  coupons_used: [{
    type: String,
    required: false
  }],
  highest_discount_ever_applied: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

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
    required: false
  },
  agreement_signed_at: {
    type: Date,
    required: false
  }
}, { _id: false });

// Instance methods
vendorSchema.methods.addService = function(serviceId) {
  if (!this.services.includes(serviceId)) {
    this.services.push(serviceId);
  }
  return this.save();
};

vendorSchema.methods.removeService = function(serviceId) {
  this.services = this.services.filter(id => id !== serviceId);
  return this.save();
};

vendorSchema.methods.addCompletedService = function(serviceId) {
  if (!this.completed_services.includes(serviceId)) {
    this.completed_services.push(serviceId);
  }
  return this.save();
};

vendorSchema.methods.removeCompletedService = function(serviceId) {
  this.completed_services = this.completed_services.filter(id => id !== serviceId);
  return this.save();
};

vendorSchema.methods.addUsedCoupon = function(couponCode) {
  if (!this.coupons_used.includes(couponCode)) {
    this.coupons_used.push(couponCode);
  }
  return this.save();
};

vendorSchema.methods.updateHighestDiscount = function(discountAmount) {
  if (discountAmount > this.highest_discount_ever_applied) {
    this.highest_discount_ever_applied = discountAmount;
    return this.save();
  }
  return this;
};

// Static methods
vendorSchema.statics.findByWAMobile = function(waMobile) {
  return this.findOne({ wa_mobile: waMobile });
};

vendorSchema.statics.findByServiceId = function(serviceId) {
  return this.find({ services: { $in: [serviceId] } });
};

const Vendor = model("Vendor", vendorSchema);

export { 
  Vendor, 
  vendorSchema, 
  serviceLocationSchema, 
  policiesSchema,
  bankDetailsSchema,
  businessDetailsSchema
};
