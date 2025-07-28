import { mongoose, Schema as _Schema } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { businessSchema } from "./businessDetails.js";
import { bankDetailsSchema } from "./bankDetails.js"; // Import the BankDetails schema
import { couponUsageSchema } from "./coupon.js"; // Import the coupon usage schema

const Schema = _Schema;

const vendorSchema = new Schema({
  id: {
    type: String,
    default: () => generateUniqueId("ven"),
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  businessDetails: businessSchema,
  bankDetails: { type: [bankDetailsSchema], default: [] }, // Embed bank details in the vendor schema
  profilePic: { type: String },
  invoices: { type: [String], default: [] },
  serviceIds: [
    {
      serType: { type: String },
      serId: { type: String },
    },
  ],
  couponDetails: {
    appliedCoupons: [couponUsageSchema],
    highestDiscountUsed: {
      type: Number,
      default: 0,
      enum: [0, 25, 50, 100],
    },
    canUseDiscounts: {
      type: [Number],
      default: [25, 50, 100],
    },
  },
});

export const Vendor = mongoose.model("Vendors", vendorSchema);
