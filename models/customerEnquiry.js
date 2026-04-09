import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const customerEnquirySchema = new mongoose.Schema({
  enquiry_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("ENQ")
  },
  anon_customer_id: {
    type: String,
    ref: 'AnonymousUser',
    required: false
  },
  customer_id: {
    type: String,
    required: false
  },
  event_type: {
    type: String
  },
  event_date: {
    type: Date
  },
  event_time: {
    type: String
  },
  city: {
    type: String
  },
  venue_setting: {
    type: String // At home, Outdoor
  },
  venue_help_needed: {
    type: Boolean
  },
  services_needed: {
    type: [String]
  },
  pending_others_input: {
    type: Boolean,
    default: false
  },
  other_service_details: {
    type: String
  },
  guest_count: {
    type: String
  },
  budget_option: {
    type: String // Yes, No
  },
  budget_range: {
    type: String
  },
  customer_name: {
    type: String
  },
  phone_number: {
    type: String
  },
  best_time_to_call: {
    type: String
  },
  status: {
    type: String,
    enum: ["OPEN", "COLLECTING_DATE", "COLLECTING_LOCATION", "COLLECTING_VENUE", "COLLECTING_SERVICES", "COLLECTING_BUDGET", "COLLECTING_CONTACT", "PROCESSING", "FLOW_COMPLETE", "CLOSED", "CONVERTED"],
    default: "OPEN"
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'customer_enquiries'
});

customerEnquirySchema.index({ anon_customer_id: 1 });
customerEnquirySchema.index({ status: 1 });

const CustomerEnquiry = mongoose.models.CustomerEnquiry || mongoose.model('CustomerEnquiry', customerEnquirySchema);

export default CustomerEnquiry;
