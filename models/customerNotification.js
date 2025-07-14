import mongoose from "mongoose";

const customerNotificationSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
  },
  message : {
    type: String,
  },
  orderId: {
    type: String,
    required: true,
  },
  vendorId: {
    type: String,
    required: true,
  },
  finalPrice: {
    type: Number,
  },
  checkoutURL: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("CustomerNotification", customerNotificationSchema);
