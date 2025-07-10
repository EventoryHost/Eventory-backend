import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema({
  orderId: String,
  vendorId: String,
  customerId: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("adminNotification", adminNotificationSchema);
