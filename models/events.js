import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import Counter from "./counter.model.js";

// Event Cart Schema according to ERD
const cartItemSchema = new mongoose.Schema({
  entity: {
    type: String
  },
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
  },
  tax_rate: {
    type: Number
  },
  tax_type: {
    type: String
  },
  tax_amount: {
    type: Number
  },
  total_amount: {
    type: Number
  }
}, { _id: false });

// Payment Breakdowns Schema (embedded in Events)
const paymentBreakdownsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Unpaid", "Paid", "Failed"],
    default: "Unpaid"
  },
  custom_items: [{
    name_of_service: String,
    price: Number,
    description: String
  }]
}, { _id: false });

// Events Schema
const eventsSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("EVTY")
  },
  event_number: {
    type: Number,
    unique: true,
    // required: true,
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
  quotation_id: {
    type: String
  },
  em_id: {
    type: String
  },
  event_type: {
    type: String
  },
  location_type: {
    type: String,
    required: true,
    enum: ['INDOOR', 'OUTDOOR'],
    validate: {
      validator: function (v) {
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
      validator: function (v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Event start date must be a valid date'
    }
  },
  event_end: {
    type: Date,
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v) && v >= this.event_start;
      },
      message: 'Event end date must be on or after event start date'
    }
  },
  event_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  event_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  final_guest_count: {
    type: Number,
    min: 1
  },
  specific_terms: {
    type: [String],
    default: []
  },
  final_amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (v) {
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
    type: String
  },
  customer_name: {
    type: String,
    required: true // Customer's name for which booking has been placed
  },
  vendor_manager_contact_number: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^\d{10}$/.test(v);
      },
      message: 'Vendor manager contact must be a valid 10-digit number'
    }
  },
  vendor_manager_contact_email: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  customer_contact_number: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^\d{10}$/.test(v);
      },
      message: 'Customer contact must be a valid 10-digit number'
    }
  },
  customer_contact_email: {
    type: String,
    validate: {
      validator: function (v) {
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
  payment_status: {
    type: String,
    required: true,
    enum: ['advance_paid', 'fully_paid', 'refunded'],
    default: 'advance_paid',
  },
  payment_method: {
    type: String
  },
  payment_details: {
    customerPayable: {
      total: { type: Number, default: 0 },
      baseAmount: { type: Number, default: 0 },
      convenienceFee: { type: Number, default: 0 },
      taxOnConvenience: { type: Number, default: 0 },
      convenienceFeeBefore: { type: Number, default: 0 },
      taxOnConvenienceBefore: { type: Number, default: 0 },
      couponCode: { type: String, default: null },
      discountAmount: { type: Number, default: 0 }
    },
    vendorReceivable: {
      total: { type: Number, default: 0 },
      baseAmount: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      taxOnCommission: { type: Number, default: 0 }
    }
  },
  payment_breakdowns: {
    type: [paymentBreakdownsSchema],
    default: []
  },
  payment_method_details: [
    {
      payment_method: {
        type: String,
        enum: ['upi', 'netbanking', 'card', 'app', 'cardless_emi', 'paylater', 'banktransfer'],
      },
      channel: {
        type: String
      },
      cf_payment_id: {
        type: String
      },
      payment_amount: {
        type: Number
      },
      payment_completion_time: {
        type: Date
      },
      payment_status: {
        type: String
      },
      payment_message: {
        type: String
      },
      payment_group: {
        type: String
      },
      method_details: {
        // nested sub‐object for each method type
        upi: {
          channel: String,
          upi_id: String,
          upi_payer_ifsc: String,
          upi_payer_account_number: String
        },
        card: {
          card_number_masked: String,
          card_holder_name: String,
          expiry_mm: String,
          expiry_yy: String,
          card_network: String
        },
        netbanking: {
          bank_code: String,
          bank_name: String,
          account_number: String
        },
        app: {
          app_name: String,
          wallet_id: String
        },
        banktransfer: {
          bank_account_number: String,
          ifsc: String,
          bank_name: String
        },
        paylater: {
          provider: String,
          plan_id: String
        },
        cardless_emi: {
          provider: String,
          emi_plan_id: String
        }
      }
    }
  ],
  final_order_items: [cartItemSchema] // Array of cart items
}, {
  collection: 'events'
});

eventsSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: "event_number" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true } // create if doesn't exist
      );

      this.event_number = counter.seq; // assign the incremented number
    } catch (err) {
      return next(err);
    }
  }

  next();
});
// Pre-save middleware to update event_updated_at on every save
eventsSchema.pre('save', function (next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.event_updated_at = new Date(now.getTime() + istOffset);
  }

  // Basic validation only
  if (this.already_paid_amount > this.final_amount) {
    return next(new Error('Already paid amount cannot exceed final amount'));
  }

  next();
});

// Pre-update middleware to update event_updated_at on updates
eventsSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ event_updated_at: new Date(now.getTime() + istOffset) });
  next();
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
eventsSchema.index({ event_created_at: -1 });
eventsSchema.index({ event_updated_at: -1 });
eventsSchema.index({ event_id: 1 });
eventsSchema.index({ quotation_id: 1 });

const Events = mongoose.model('Events', eventsSchema);

export { Events, eventsSchema, cartItemSchema };
