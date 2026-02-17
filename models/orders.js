import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Order Cart Schema (embedded in Orders)
const orderCartSchema = new Schema({
  entity: {
    type: String // Customer or vendor
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
    type: Number // Tax in %
  },
  tax_type: {
    type: String // GST/CGST/IGST
  },
  tax_amount: {
    type: Number
  },
  total_amount: {
    type: Number
  }
}, { _id: false });

// Last Approval Schema (embedded in Orders)
const lastApprovalSchema = new Schema({
  approval_by: {
    type: String,
    enum: ['Customer', 'Vendor'],
    required: true
  },
  value: {
    type: Boolean,
    required: true
  }
}, { _id: false });

// Payment Details Schema (embedded in Orders)
const paymentDetailsSchema = new Schema({
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Fully Paid", "Partially Paid", "Failed"],
    default: "Unpaid"
  },
  customerPayable: {
    total: { type: Number, default: 0 },
    baseAmount: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    taxOnConvenience: { type: Number, default: 0 }
  },
  vendorReceivable: {
    total: { type: Number, default: 0 },
    baseAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    taxOnCommission: { type: Number, default: 0 }
  }
}, { _id: false });

// Orders Schema according to ERD
const ordersSchema = new Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("ODR")
  },
  em_id: {
    type: String,
    required: true
    // EMyyyymmddhhmmss who created this order
  },
  service_id: {
    type: String,
    required: true
    // {}YYYYMMDDhhmmss for which service provider
  },
  vendor_id: {
    type: String,
    required: true
    // VENyyyymmddhhmmss
  },
  quotation_id: {
    type: String,
    // required: true -- Made optional for Custom Orders
    // QUOyyyymmddhhmmss, which quotation got converted to order
  },
  vendor_manager_name: {
    type: String,
    required: true
    // Manager responsible for the event/booking from vendor's side
  },
  customer_name: {
    type: String,
    required: true
    // Customer's name for which booking has been placed
  },
  customer_id: {
    type: String,
    required: true
    // Customer's id for which booking has been placed
  },
  event_start: {
    type: Date,
    required: true,
    set: function (value) {
      if (value instanceof Date) {
        // Convert to IST (UTC+5:30) if it's a Date object
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(value.getTime() + istOffset);
      }
      return value;
    }
    // When the event will start
  },
  event_end: {
    type: Date,
    required: true,
    set: function (value) {
      if (value instanceof Date) {
        // Convert to IST (UTC+5:30) if it's a Date object
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(value.getTime() + istOffset);
      }
      return value;
    },
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v) && v >= this.event_start;
      },
      message: 'Event end date must be on or after event start date'
    }
    // When the event will get over
  },
  event_type: {
    type: String,
    required: true
    // Name of The Event
  },
  final_guest_count: {
    type: Number
    // Guest count for which booking took place (optional)
  },
  location_type: {
    type: String,
    enum: ['indoor', 'outdoor']
    // indoor when vendor visits customer, outdoor vice versa
  },
  event_location: {
    type: String,
    required: true
    // Address of either vendor or customer
  },
  final_amount: {
    type: Number,
    required: true,
    min: 0
    // Total Final amount - Vendor's base + Eventory Commission + convenience + TAX
  },
  final_checkout_url: {
    type: String
    // Checkout URL
  },
  advance_amount_requested: {
    type: Number,
    min: 0
    // Advance amount requested
  },
  vendor_approval: {
    type: Boolean,
    default: false
    // Yes/No, default No
  },
  customer_approval: {
    type: Boolean,
    default: false
    // Yes/No, default No
  },
  original_ask_by_customer: {
    type: String
    // Requirements of the customer (optional)
  },
  last_approval: {
    type: lastApprovalSchema
  },
  order_status: {
    type: String,
    required: true,
    enum: ['pending', 'semi-approved', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
    // Order status, default created -> pending
  },
  vendor_manager_contact_number: {
    type: String,
    // required: true -- Made optional for Custom Orders
    // Phone number of vendor (ONLY VISIBLE TO EM)
  },
  vendor_manager_contact_email: {
    type: String,
    // required: true -- Made optional for Custom Orders
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow null/empty
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
    // Email of vendor (ONLY VISIBLE TO EM)
  },
  customer_contact_number: {
    type: String,
    required: true
    // Phone number of customer (ONLY VISIBLE TO EM AND VENDOR if access given by EM)
  },
  customer_contact_email: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
    // Email of customer (ONLY VISIBLE TO EM AND VENDOR if access given by EM)
  },
  final_order_items: [orderCartSchema], // Array of cart items
  paymentDetails: {
    type: paymentDetailsSchema
  },
  specificTerms: {
    type: [String],
    default: []
  },
  order_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    },
    required: true
    // Order created Date time
  },
  order_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'orders'
});

// Pre-save middleware to update order_updated_at on every save
ordersSchema.pre('save', function (next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.order_updated_at = new Date(now.getTime() + istOffset);
  }

  // Update order status based on approvals
  if (this.vendor_approval && this.customer_approval) {
    this.order_status = 'approved';
  } else if (this.vendor_approval || this.customer_approval) {
    this.order_status = 'semi-approved';
  }

  next();
});

// Pre-update middleware to update order_updated_at on updates
ordersSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ order_updated_at: new Date(now.getTime() + istOffset) });
  next();
});

// Indexes for better performance
ordersSchema.index({ em_id: 1 });
ordersSchema.index({ service_id: 1 });
ordersSchema.index({ vendor_id: 1 });
ordersSchema.index({ quotation_id: 1 });
ordersSchema.index({ order_status: 1 });
ordersSchema.index({ event_start: 1 });
ordersSchema.index({ event_end: 1 });
ordersSchema.index({ order_created_at: -1 });
ordersSchema.index({ order_updated_at: -1 });
ordersSchema.index({ "paymentDetails.paymentStatus": 1 });
ordersSchema.index({ "paymentDetails.transactionId": 1 });

// Check if model already exists to prevent OverwriteModelError
const Orders = mongoose.models.Orders || mongoose.model('Orders', ordersSchema);

export default Orders;
export { ordersSchema, orderCartSchema, lastApprovalSchema, paymentDetailsSchema };
