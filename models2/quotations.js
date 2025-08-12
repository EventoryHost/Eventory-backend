import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Quotations Schema according to ERD
const quotationsSchema = new Schema({
  quotation_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("QUO")
  },
  customer_id: {
    type: String,
    required: true
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_id: {
    type: String,
    required: true
  },
  quote_status: {
    type: String,
    required: true,
    enum: ['Pending', 'Accepted', 'Rejected', 'In_Progress', 'In_Booking'],
    default: 'Pending'
  },
  customer_name: {
    type: String,
    required: true
  },
  customer_contact_number: {
    type: String,
    required: true
    // Not visible to Vendor, Only for EMs
  },
  event_start: {
    type: Date,
    required: true
  },
  event_end: {
    type: Date,
    required: true
  },
  guest_count: {
    type: Number,
    min: 1
  },
  event_type: {
    type: String,
    required: true
  },
  location_type: {
    type: String,
    required: true,
    enum: ['indoor', 'outdoor']
  },
  event_location: {
    type: String,
    required: true
  },
  customer_requirements: {
    type: String,
    required: true,
    maxlength: 2000
  },
  quotation_created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  quotation_updated_at: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true,
  collection: 'quotations'
});

// Indexes for better performance
quotationsSchema.index({ customer_id: 1, quote_status: 1 });
quotationsSchema.index({ vendor_id: 1, quote_status: 1 });
quotationsSchema.index({ service_id: 1 });
quotationsSchema.index({ quotation_created_at: -1 });
quotationsSchema.index({ event_start: 1 });

// Pre-save middleware
quotationsSchema.pre('save', function(next) {
  this.quotation_updated_at = new Date();
  
  // Validate event dates
  if (this.event_start && this.event_end && this.event_start >= this.event_end) {
    next(new Error('Event end date must be after start date'));
  } else {
    next();
  }
});

// Check if model already exists to prevent OverwriteModelError
const Quotations = mongoose.models.Quotations || mongoose.model('Quotations', quotationsSchema);

export default Quotations;
