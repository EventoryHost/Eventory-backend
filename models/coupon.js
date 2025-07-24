import mongoose from "mongoose";
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  team: {
    type: String,
    required: true,
    enum: ["Sales", "Social Media", "Event"],
  },
  discount: {
    type: Number,
    required: true,
    enum: [25, 50, 100],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const couponUsageSchema = new Schema({
  couponCode: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  originalAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);
const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export { Coupon, couponSchema, CouponUsage, couponUsageSchema };
