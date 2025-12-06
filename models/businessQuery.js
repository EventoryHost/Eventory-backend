import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Business Query Schema according to ERD
const businessQuerySchema = new Schema({
  query_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("QUE")
  },
  query_type: {
    type: String,
    required: true,
    enum: ['business_query', 'customer_query']
  },
  query_status: {
    type: String,
    required: true,
    enum: ['raised', 'resolved', 'rejected'],
    default: 'raised'
  },
  sender_name: {
    type: String
  },
  sender_contact_number: {
    type: String
  },
  sender_email: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  sender_services: [{
    type: String
  }],
  sender_city: {
    type: String
  },
  business_query: {
    type: String,
    required: true
  },
  query_received_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  query_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'business_queries'
});

// Pre-save middleware to update query_updated_at on every save
businessQuerySchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.query_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

// Pre-update middleware to update query_updated_at on updates
businessQuerySchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ query_updated_at: new Date(now.getTime() + istOffset) });
  next();
});

// Indexes for better performance
businessQuerySchema.index({ sender_email: 1 });
businessQuerySchema.index({ sender_city: 1 });
businessQuerySchema.index({ query_received_at: -1 });
businessQuerySchema.index({ query_status: 1 });

// Check if model already exists to prevent OverwriteModelError
const BusinessQuery = mongoose.models.BusinessQuery || mongoose.model('BusinessQuery', businessQuerySchema);

export default BusinessQuery;
