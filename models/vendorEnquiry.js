import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const vendorEnquirySchema = new mongoose.Schema({
  vendor_enquiry_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("VENQ")
  },
  customer_enquiry_id: {
    type: String,
    ref: 'CustomerEnquiry',
    required: true
  },
  vendor_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["SENT", "ACCEPTED", "REJECTED", "QUOTED"],
    default: "SENT"
  },
  quote_details: {
    price: Number,
    message: String,
    valid_until: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'vendor_enquiries'
});

vendorEnquirySchema.index({ customer_enquiry_id: 1 });
vendorEnquirySchema.index({ vendor_id: 1 });

const VendorEnquiry = mongoose.models.VendorEnquiry || mongoose.model('VendorEnquiry', vendorEnquirySchema);

export default VendorEnquiry;
