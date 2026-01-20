import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Vendor Enquiry Schema
const vendorEnquirySchema = new Schema({
  enquiry_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("ENQ")
  },
  
  // Vendor Information
  vendor_id: {
    type: String,
    required: true,
    index: true
  },
  vendor_name: {
    type: String,
    required: true
  },
  vendor_email: {
    type: String,
  },
  vendor_mobile: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid mobile number format'
    }
  },
  vendor_type: {
    type: String,
    required: true,
    enum: ['caterer', 'decorator', 'venue_provider', 'photographer_videographer', 'makeupartist', 'dj_artist']
  },
  service_id: {
    type: String,
    required: true
  },
  
  // Admin Information
  em_id: {
    type: String,
    required: true,
    index: true
  },
  em_name: {
    type: String,
    required: true
  },
  
  // Chat Link (Critical for communication)
  chat_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Status & Tracking
  enquiry_status: {
    type: String,
    required: true,
    enum: ['active', 'resolved', 'closed'],
    default: 'active',
    index: true
  },
  
  // Message tracking
  last_message: {
    type: String,
    default: null
  },
  last_message_time: {
    type: Date,
    default: null
  },
  last_message_by: {
    type: String,
    enum: ['em', 'vendor', null],
    default: null
  },
  
  // Admin notes
  notes: {
    type: String,
    default: null
  },
  
  // Timestamps (IST)
  created_at: {
    type: Date,
    default: () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  updated_at: {
    type: Date,
    default: () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  resolved_at: {
    type: Date,
    default: null
  }
}, {
  collection: 'vendor_enquiries'
});

// Pre-save middleware to update updated_at
vendorEnquirySchema.pre('save', function (next) {
  if (!this.isNew) {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

// Pre-update middleware
vendorEnquirySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ updated_at: new Date(now.getTime() + istOffset) });
  next();
});

const VendorEnquiry = mongoose.models.VendorEnquiry || mongoose.model('VendorEnquiry', vendorEnquirySchema);

export default VendorEnquiry;
