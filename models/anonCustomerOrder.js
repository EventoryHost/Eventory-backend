import mongoose from "mongoose";

const anonOrderItemSchema = new mongoose.Schema({
  entity: {
    type: String,
    default: "customer"
  },
  name_of_service: {
    type: String,
    required: true
  },
  service_asset: [{
    type: String 
  }],
  quantity: {
    type: Number,
    default: 1,
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
    type: Number,
    default: 0 
  },
  tax_type: {
    type: String,
    default: "GST"
  },
  tax_amount: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true
  }
}, { _id: false });

const anonPaymentDetailsSchema = new mongoose.Schema({
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

const anonCustomerOrderSchema = new mongoose.Schema({
  checkout_url: {
    type: String,
    default: null
  },
  anon_order_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `ANON_ODR_${Date.now()}`
  },
  
  chat_id: {
    type: String,
    required: true,
    index: true
  },
  
  anon_user_id: {
    type: String,
    required: true,
    index: true
  },
  
  em_id: {
    type: String,
    required: true,
    default: 'EM_SYSTEM'
  },
  
  service_id: {
    type: String,
    default: null
  },
  
  vendor_id: {
    type: String,
    default: null
  },
  
  vendor_name: {
    type: String,
    default: null
  },
  
  customer_name: {
    type: String,
    default: "Anonymous Customer"
  },
  
  customer_contact_number: {
    type: String,
    default: null
  },
  
  customer_contact_email: {
    type: String,
    default: null
  },
  
  event_type: {
    type: String,
    default: null 
  },
  
  event_start: {
    type: Date,
    default: null
  },
  
  event_end: {
    type: Date,
    default: null
  },
  
  event_time: {
    type: String,
    default: null
  },
  
  event_location: {
    type: String,
    default: null
  },
  
  location_type: {
    type: String,
    enum: ['indoor', 'outdoor', null],
    default: null
  },
  
  guest_count: {
    type: Number,
    default: null
  },
  
  budget: {
    type: Number,
    default: null
  },
  
  final_order_items: [anonOrderItemSchema],
  
  final_amount: {
    type: Number,
    default: 0
  },
  
  advance_amount_requested: {
    type: Number,
    default: 0
  },
  
  paymentDetails: {
    type: anonPaymentDetailsSchema,
    default: () => ({})
  },
  
  specificTerms: {
    type: [String],
    default: []
  },
  
  order_status: {
    type: String,
    enum: ['draft', 'pending', 'sent_to_customer', 'approved', 'rejected', 'converted', 'cancelled'],
    default: 'draft'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  em_notes: {
    type: String,
    default: ''
  },
  
  customer_requirements: {
    type: String,
    default: ''
  },
  
  source_info: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    referrer: String,
    landing_page: String,
    device_info: String
  },
  
  converted_to_order_id: {
    type: String,
    default: null
  },
  
  converted_at: {
    type: Date,
    default: null
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'anon_customer_orders',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
anonCustomerOrderSchema.index({ chat_id: 1 });
anonCustomerOrderSchema.index({ anon_user_id: 1 });
anonCustomerOrderSchema.index({ order_status: 1 });
anonCustomerOrderSchema.index({ created_at: -1 });
anonCustomerOrderSchema.index({ priority: 1 });

const AnonCustomerOrder = mongoose.model('AnonCustomerOrder', anonCustomerOrderSchema);

export default AnonCustomerOrder;
