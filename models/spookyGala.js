import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const SpookyGalaSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUniqueId("spooky")
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 499
    },
    basePrice: {
      type: Number,
      required: true,
      default: 1000
    },
    subtotal: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0.18
    },
    taxAmount: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentDetails: {
      cashfreeOrderId: {
        type: String,
        required: false
      },
      paymentMethod: {
        type: String,
        required: false
      },
      transactionId: {
        type: String,
        required: false
      },
      paidAt: {
        type: Date,
        required: false
      }
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for pass details
SpookyGalaSchema.virtual('passDetails').get(function() {
  return {
    eventName: "Spooky Gala ft Halloween Passes",
    eventDate: "October 31, 2024",
    eventTime: "7:00 PM - 12:00 AM",
    eventLocation: "Halloween Central",
    quantity: this.quantity,
    totalAmount: this.totalAmount
  };
});

// Index for better query performance
SpookyGalaSchema.index({ customerEmail: 1 });
SpookyGalaSchema.index({ orderId: 1 });
SpookyGalaSchema.index({ paymentStatus: 1 });
SpookyGalaSchema.index({ createdAt: -1 });

const SpookyGala = mongoose.model("SpookyGala", SpookyGalaSchema);

export default SpookyGala;
