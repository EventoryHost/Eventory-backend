import mongoose from "mongoose";

const customerNotificationSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
  },
  message: {
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
  quotationId: {
    type: String,
  },
  type: {
    type: String,
    enum: [
      'quotation',  
      'order_request',
      'order_approved',
      "order_pending",
      'payment_done',
      'misc',
      "booking_confirmed",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("CustomerNotification", customerNotificationSchema);
