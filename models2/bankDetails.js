import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

// Bank Details Schema for reuse across all service models
const bankDetailsSchema = new Schema({
  vendor_id: {
    type: String,
    required: true
  },
  service_id: {
    type: String,
    required: true
  },
  bank_name: {
    type: String
  },
  account_type: {
    type: String,
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

// Pre-save middleware to update bank_updated_at on every save
bankDetailsSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.bank_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

export { bankDetailsSchema };
