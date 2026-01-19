import mongoose from "mongoose";

const vendorPreferenceSchema = new mongoose.Schema(
  {
    customer_id: {
      type: String,
      required: true,
      index: true,
    },
    vendor_id: {
      type: String,
      required: true,
      index: true,
    },
    service_id: {
      type: String,
      required: true,
      index: true,
    },
    preference_type: {
      type: String,
      enum: ['liked', 'rejected'],
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


const VendorPreference = mongoose.model("VendorPreference", vendorPreferenceSchema);

export default VendorPreference;
