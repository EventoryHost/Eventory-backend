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
    type: String
  },
  contact_number: {
    type: String,
    required: true,
    // validate: {
    //   validator: function(v) {
    //     return /^[6-9]\d{9}$/.test(v);
    //   },
    //   message: props => `${props.value} is not a valid Indian mobile number!`
    // }
  },
  email_address: {
    type: String,
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
  },
  pincode: {
    type: String, // Changed from Number to String to match ERD
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit pincode!`
    }
  },
  wishlisted_services: [{
    type: String // Array of service_id's
  }],
  customer_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  customer_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'customers'
});

// Pre-save middleware to update customer_updated_at on every save
customerSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.customer_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

// Pre-update middleware to update customer_updated_at on updates
customerSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ customer_updated_at: new Date(now.getTime() + istOffset) });
  next();
});

// Method to add service to wishlist
customerSchema.methods.addToWishlist = function(serviceId) {
  if (!this.wishlisted_services.includes(serviceId)) {
    this.wishlisted_services.push(serviceId);
    
    // Update timestamp in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.customer_updated_at = new Date(now.getTime() + istOffset);
    
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove service from wishlist
customerSchema.methods.removeFromWishlist = function(serviceId) {
  const index = this.wishlisted_services.indexOf(serviceId);
  if (index > -1) {
    this.wishlisted_services.splice(index, 1);
    
    // Update timestamp in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.customer_updated_at = new Date(now.getTime() + istOffset);
    
    return this.save();
  }
  return Promise.resolve(this);
};

// Indexes for better performance
customerSchema.index({ contact_number: 1 });
customerSchema.index({ email_address: 1 });
customerSchema.index({ pincode: 1 });
customerSchema.index({ customer_created_at: -1 });
customerSchema.index({ customer_updated_at: -1 });
customerSchema.index({ customer_id: 1 });

const Customer = mongoose.model('Customers', customerSchema);

export { Customer, customerSchema };
