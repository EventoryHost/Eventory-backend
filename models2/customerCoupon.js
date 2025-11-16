import mongoose from "mongoose";

const { Schema } = mongoose;

const customerCouponSchema = new Schema(
  {
    coupon_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    coupon_team: {
      type: String,
      required: true,
      enum: ["SALES", "SOCIAL MEDIA", "EVENT"],
      uppercase: true,
    },
    discount_percentage: {
      type: Number,
      required: true,
      enum: [25, 50, 100],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    coupon_created_at: {
      type: Date,
      default: () => new Date(),
    },
    coupon_updated_at: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
    collection: "customer-coupons",
  },
);

const customerCouponUsageSchema = new Schema(
  {
    coupon_code: { type: String, required: true },
    discount_percentage: { type: Number, required: true },
    applied_at: { type: Date, default: () => new Date() },
    original_amount: { type: Number, required: true },
    discount_amount: { type: Number, required: true },
    final_amount: { type: Number, required: true },
  },
  { _id: false },
);

customerCouponSchema.index({ coupon_team: 1 });
customerCouponSchema.index({ is_active: 1 });
customerCouponSchema.index({ coupon_team: 1, is_active: 1 });

customerCouponSchema.pre("save", function (next) {
  const now = new Date();
  this.coupon_updated_at = now;

  if (this.coupon_code) {
    this.coupon_code = this.coupon_code.toUpperCase();
  }
  if (this.coupon_team) {
    this.coupon_team = this.coupon_team.toUpperCase();
  }

  next();
});

customerCouponSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  this.set({ coupon_updated_at: new Date() });
  next();
});

const CustomerCoupon =
  mongoose.models.CustomerCoupon ||
  mongoose.model("CustomerCoupon", customerCouponSchema, "customer-coupons");

export { CustomerCoupon, customerCouponUsageSchema };

