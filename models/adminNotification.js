// models/adminNotification.js
import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema({
  adminId: String,
  orderId: String,
  vendorId: String,
  customerId: String,
  message: String,
  read: {
    type: Boolean,
    default: false, // unread by default
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("adminNotification", adminNotificationSchema);
