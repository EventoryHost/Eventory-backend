import { mongoose, Schema as _Schema } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { couponUsageSchema } from "./coupon.js";
const Schema = _Schema;

const CustomerSchema = new Schema({
  id: {
    type: String,
    default: () => generateUniqueId("cus"),
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, default: "" },
  state: { type: String, default: "" },
  city: { type: String, default: "" },
  address: { type: String, default: "" },
  pincode: { type: String, default: "" },
  invoices: { type: [String], default: [] },
  quotations: [
    {
      serviceId: { type: String, required: true },
      quotationId: { type: String, required: true },
    },
  ],
  favoriteServices: [{ type: String }],
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

const Customer = mongoose.model("Customer", CustomerSchema);

export { Customer, CustomerSchema };
