import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Order Cart Schema (embedded in Orders)
const orderCartSchema = new Schema({
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
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
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
    required: true
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
  event_start: {
    type: Date,
    required: true
    // When the event will start
  },
  event_end: {
    type: Date,
    required: true
    // When the event will get over
  },
  event_type: {
    type: String,
    required: true
    // Name of The Event
  },
  final_guest_count: {
    type: Number,
    required: false
    // Guest count for which booking took place (optional)
  },
  location_type: {
    type: String,
    required: true,
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
    type: String,
    required: false
    // Checkout URL
  },
  advance_amount_requested: {
    type: Number,
    required: false,
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
    type: String,
    required: false
    // Requirements of the customer (optional)
  },
  last_approval: {
    type: lastApprovalSchema,
    required: false
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
    required: true
    // Phone number of vendor (ONLY VISIBLE TO EM)
  },
  vendor_manager_contact_email: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
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
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
    // Email of customer (ONLY VISIBLE TO EM AND VENDOR if access given by EM)
  },
  final_order_items: [{
    type: orderCartSchema,
    required: true
  }],
  order_created_at: {
    type: Date,
    default: Date.now,
    required: true
    // Order created Date time
  }
}, {
  timestamps: true,
  collection: 'orders'
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

// Pre-save middleware
ordersSchema.pre('save', function(next) {
  // Update order status based on approvals
  if (this.vendor_approval && this.customer_approval) {
    this.order_status = 'approved';
  } else if (this.vendor_approval || this.customer_approval) {
    this.order_status = 'semi-approved';
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const Orders = mongoose.models.Orders || mongoose.model('Orders', ordersSchema);

export default Orders;
export { ordersSchema, orderCartSchema, lastApprovalSchema };
