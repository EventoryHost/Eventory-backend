import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

// Business Details Schema for reuse across all service models
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

// Pre-save middleware to update business_updated_at on every save
businessDetailsSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.business_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

export { businessDetailsSchema };
