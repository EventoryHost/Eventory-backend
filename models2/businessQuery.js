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
    enum: ['business_query', 'customer_query'],
    default: 'business_query'
  },
  sender_name: {
    type: String,
    required: true
  },
  sender_contact_number: {
    type: String,
    required: true
  },
  sender_email: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  sender_services: {
    type: [String],
    required: false,
    default: []
  },
  sender_city: {
    type: String,
    required: true
  },
  business_query: {
    type: String,
    required: true,
    maxlength: 2000
  }
}, {
  timestamps: true,
  collection: 'business_queries'
});

// Indexes for better performance
businessQuerySchema.index({ sender_email: 1 });
businessQuerySchema.index({ sender_city: 1 });
businessQuerySchema.index({ createdAt: -1 });

// Check if model already exists to prevent OverwriteModelError
const BusinessQuery = mongoose.models.BusinessQuery || mongoose.model('BusinessQuery', businessQuerySchema);

export default BusinessQuery;
