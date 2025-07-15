import mongoose from "mongoose";

const vendorNotificationSchema = new mongoose.Schema({
  orderId: String,
  vendorId: String,
  customerId: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, // <-- Add this line
});


export default mongoose.model("vendorNotification", vendorNotificationSchema);
