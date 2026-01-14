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
    required: true
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
  status: {
    type: String,
    enum: ["OPEN", "PROCESSING", "CLOSED", "CONVERTED"],
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
