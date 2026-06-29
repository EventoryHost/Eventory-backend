import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Coupons Schema according to ERD only
const couponsSchema = new Schema(
  {
    coupon_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9]+$/.test(v);
        },
        message: "Coupon code must contain only uppercase letters and numbers",
      },
    },
    coupon_family: {
      type: String,
      required: true,
      enum: ["SALES", "SMM", "EM", "EVTY"],
      uppercase: true,
    },
    coupon_value: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    coupon_created_at: {
      type: Date,
      default: Date.now,
    },
    coupon_updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: "coupons",
  },
);

// Indexes for better performance
couponsSchema.index({ coupon_family: 1 });
couponsSchema.index({ is_active: 1 });
couponsSchema.index({ coupon_family: 1, is_active: 1 });

// Pre-save middleware
couponsSchema.pre("save", function (next) {
  // Update coupon_updated_at on every save
  this.coupon_updated_at = new Date();

  // Ensure coupon_code is uppercase
  if (this.coupon_code) {
    this.coupon_code = this.coupon_code.toUpperCase();
  }

  // Ensure coupon_family is uppercase
  if (this.coupon_family) {
    this.coupon_family = this.coupon_family.toUpperCase();
  }

  next();
});

// Check if model already exists to prevent OverwriteModelError
const Coupons =
  mongoose.models.Coupons || mongoose.model("Coupons", couponsSchema);

export default Coupons;
