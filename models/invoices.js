import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

// Counter Schema for auto-incremental invoice numbers
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Helper function to get next invoice number
const getNextInvoiceNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'invoice_no',
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// Invoices Schema according to ERD
const invoicesSchema = new mongoose.Schema({
  invoice_no: {
    type: Number,
    // required: true,
    unique: true
    // Auto-incremental number - will be set in pre-save middleware
  },
  invoice_id: {
    type: String,
    // required: true,
    unique: true,
    default: () => generateUniqueId("INV")
  },
  invoice_url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['registration', 'advance_booking', 'booking', 'payment']
  },
  invoice_for: {
    type: String,
    required: true,
    enum: ['customer', 'vendor']
  },
  payment_label: {
    type: String // e.g. "token", "advance1", "finalpay", "lastpay"
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_id: {
    type: String,
    required: true
  },
  customer_id: {
    type: String // Will be null when type=registration
  },
  event_id: {
    type: String // Event_id for any event. null in case of registration
  },
  transaction_id: {
    type: String
  },
  invoice_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'invoices'
});

// Indexes for better performance
invoicesSchema.index({ vendor_id: 1 });
invoicesSchema.index({ service_id: 1 });
invoicesSchema.index({ customer_id: 1 });
invoicesSchema.index({ event_id: 1 });
invoicesSchema.index({ transaction_id: 1 });
invoicesSchema.index({ type: 1 });
invoicesSchema.index({ invoice_created_at: -1 });

// Pre-save middleware
invoicesSchema.pre('save', async function (next) {
  try {
    // Generate auto-incremental invoice number for new documents
    if (this.isNew && !this.invoice_no) {
      this.invoice_no = await getNextInvoiceNumber();
    }

    // Validation: customer_id should be null only for registration type
    if (this.type === 'registration' && this.customer_id) {
      return next(new Error('Customer ID should be null for registration type invoices'));
    }

    if (this.type !== 'registration' && !this.customer_id) {
      return next(new Error('Customer ID is required for non-registration invoices'));
    }

    // Validation: event_id should be null for registration type
    if (this.type === 'registration' && this.event_id) {
      return next(new Error('Event ID should be null for registration type invoices'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Invoices = mongoose.model('Invoices', invoicesSchema);

export { Invoices, invoicesSchema, Counter };
