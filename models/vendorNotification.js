import mongoose from "mongoose";

const vendorNotificationSchema = new mongoose.Schema({
  orderId: String,
  vendorId: String,
  customerId: String,
  message: String,
  serviceId: {
    type: String,
  },
  quotationId: {
    type: String,
  },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, 
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
    required: true,
  },
});


export default mongoose.model("vendorNotification", vendorNotificationSchema);
