import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

// Customer Schema
const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("CUST")
  },
  customer_name: {
    type: String,
    required: true
  },
  contact_number: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid Indian mobile number!`
    }
  },
  email_address: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  customer_address: {
    type: String,
    required: false
  },
  pincode: {
    type: Number,
    required: false,
    validate: {
      validator: function(v) {
        if (v === undefined || v === null) return true;
        return /^\d{6}$/.test(String(v));
      },
      message: props => `${props.value} is not a valid 6-digit pincode!`
    }
  },
  wishlisted_services: [{
    type: String // Array of service_id's - removed ref for flexibility
  }]
}, {
  timestamps: true,
  collection: 'customers'
});

// Indexes for better performance
customerSchema.index({ contact_number: 1 });
customerSchema.index({ email_address: 1 });
customerSchema.index({ pincode: 1 });

// Instance methods (keeping only essential ones)
customerSchema.methods.getWishlistCount = function() {
  return this.whishlisted_services.length;
};

const Customer = mongoose.model('Customer2', customerSchema);

export { Customer, customerSchema };
