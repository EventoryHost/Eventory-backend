import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "./models/chats.js";
import EMNotifications from "./models/emNotifications.js";
import VendorPreference from "./models/vendorPreference.js";
import { setVendorPreference } from "./controllers/vendorPreferenceController.js";

dotenv.config();

// Mock Express Request and Response
const mockReq = (body) => ({
  body,
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function verifyNotification() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const testAnonId = "test_anon_verify_" + Date.now();
    const testEmId = "test_em_verify_" + Date.now();
    const testChatId = "test_chat_verify_" + Date.now();

    // 1. Create a dummy active chat
    await Chat.create({
      chat_id: testChatId,
      anon_customer_id: testAnonId,
      em_id: testEmId,
      chat_type: "anon_customer-admin",
      chat_status: "ACTIVE",
    });
    console.log("Created dummy chat:", testChatId);

    // 2. Call setVendorPreference
    const req = mockReq({
      customer_id: testAnonId,
      vendor_id: "test_vendor_123",
      service_id: "test_service_456",
      preference_type: "liked",
    });
    const res = mockRes();

    await setVendorPreference(req, res);
    console.log("Called setVendorPreference. Status:", res.statusCode);

    // 3. Check for EM Notification
    const notification = await EMNotifications.findOne({
      em_id: testEmId,
      chat_id: testChatId,
      notification_type: "chat_message",
    });

    if (notification) {
      console.log("SUCCESS: Notification found!", notification);
    } else {
      console.error("FAILURE: Notification NOT found!");
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: testChatId });
    await EMNotifications.deleteOne({ _id: notification?._id });
    await VendorPreference.deleteOne({ customer_id: testAnonId });
    console.log("Cleanup done.");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyNotification();
