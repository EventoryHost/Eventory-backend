// models/customerCoupon.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerCouponSchema = new Schema({
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

const customerCouponUsageSchema = new Schema({
    couponCode: { type: String, required: true },
    discount: { type: Number, required: true }, // percent
    appliedAt: { type: Date, default: Date.now },
    originalAmount: { type: Number, required: true }, // original convenience fee or total context
    discountAmount: { type: Number, required: true }, // absolute
    finalAmount: { type: Number, required: true }, // final total after discount
});

const CustomerCoupon = mongoose.model("CustomerCoupon", customerCouponSchema);
const CustomerCouponUsage = mongoose.model("CustomerCouponUsage", customerCouponUsageSchema);

export { CustomerCoupon, customerCouponSchema, CustomerCouponUsage, customerCouponUsageSchema };
