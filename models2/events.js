import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

// Event Cart Schema according to ERD
const cartItemSchema = new mongoose.Schema({
  name_of_service: {
    type: String,
    required: true
  },
  service_asset: [{
    type: String, // Array of S3 URLs (images/videos)
    required: true
  }],
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Events Schema
const eventsSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("EVTY")
  },
  customer_id: {
    type: String,
    required: true
    // Reference to customer - removed ref for flexibility
  },
  vendor_id: {
    type: String,
    required: true
    // Reference to vendor - removed ref for flexibility
  },
  service_id: {
    type: String,
    required: true
    // Reference to service - removed ref for flexibility
  },
  em_id :{
    type: String
  },
  event_type: {
    type: String,
    required: false // Name of the event (Wedding, Corporate, Birthday, etc.)
  },
  location_type: {
    type: String,
    required: true,
    enum: ['INDOOR', 'OUTDOOR'],
    validate: {
      validator: function(v) {
        return ['INDOOR', 'OUTDOOR'].includes(v);
      },
      message: 'Location type must be either INDOOR (vendor visits customer) or OUTDOOR (customer visits vendor)'
    }
  },
  event_location: {
    type: String,
    required: true // Address of either vendor or customer
  },
  event_start: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Event start date must be a valid date'
    }
  },
  event_end: {
    type: Date,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v) && v > this.event_start;
      },
      message: 'Event end date must be after event start date'
    }
  },
  event_created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  final_guest_count: {
    type: Number,
    required: false, // Optional as specified in ERD
    min: 1
  },
  final_amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Final amount must be non-negative'
    }
  },
  event_status: {
    type: String,
    required: true,
    enum: ['booked', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'booked'
  },
  vendor_manager_name: {
    type: String,
    required: false // Manager responsible for the event from vendor's side
  },
  customer_name: {
    type: String,
    required: true // Customer's name for which booking has been placed
  },
  vendor_manager_contact_number: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Vendor manager contact must be a valid Indian mobile number'
    }
  },
  vendor_manager_contact_email: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  customer_contact_number: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Customer contact must be a valid Indian mobile number'
    }
  },
  customer_contact_email: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  already_paid_amount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  advance_amount_paid: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['advance_paid', 'fully_paid', 'refunded'],
    default: 'advance_paid',
  },
  payment_method: {
    type: String,
    required: false
  },
  final_order_items: [cartItemSchema] // Array of cart items
}, {
  timestamps: true,
  collection: 'events'
});

// Indexes for better performance
eventsSchema.index({ customer_id: 1 });
eventsSchema.index({ vendor_id: 1 });
eventsSchema.index({ service_id: 1 });
eventsSchema.index({ event_status: 1 });
eventsSchema.index({ event_start: 1 });
eventsSchema.index({ event_end: 1 });
eventsSchema.index({ payment_status: 1 });
eventsSchema.index({ event_start: 1, event_end: 1 }); // Compound index for date range queries

// Pre-save middleware (minimal - only for basic validation)
eventsSchema.pre('save', function(next) {
  // Basic validation only
  if (this.already_paid_amount > this.final_amount) {
    return next(new Error('Already paid amount cannot exceed final amount'));
  }
  
  if (this.advance_amount_paid > this.final_amount) {
    return next(new Error('Advance amount cannot exceed final amount'));
  }
  
  next();
});

const Events = mongoose.model('Events', eventsSchema);

export { Events, eventsSchema, cartItemSchema };
