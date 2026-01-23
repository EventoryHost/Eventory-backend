import mongoose from "mongoose";
import { setVendorPreference } from "../controllers/vendorPreferenceController.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import VendorPreference from "../models/vendorPreference.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";
import generateUniqueId from "../utils/generateId.js";

dotenv.config();

const verifyVendorPrefTrigger = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const chatId = generateUniqueId("CHAT");
    const anonId = "ANON_TEST_" + Date.now();
    const vendorId = "VEN_TEST";
    const serviceId = "SERV_TEST";

    // 1. Create a dummy chat
    const chat = await Chat.create({
      chat_id: chatId,
      anon_customer_id: anonId,
      chat_type: "anon_customer-admin",
      chat_status: "ACTIVE"
    });
    console.log(`Created dummy chat: ${chatId} for user ${anonId}`);

    // 2. Mock Request and Response
    const req = {
      body: {
        customer_id: anonId,
        vendor_id: vendorId,
        service_id: serviceId,
        preference_type: "liked"
      },
      io: {
        to: (room) => ({
            emit: (event, data) => {
                console.log(`[MOCK IO] Emitted '${event}' to '${room}':`, data.message_type);
            }
        })
      }
    };

    const res = {
      status: (code) => ({
        json: (data) => {
            console.log(`[MOCK RES] Status ${code}:`, data.message);
            return data;
        }
      })
    };

    // 3. Call Controller
    console.log("Calling setVendorPreference...");
    await setVendorPreference(req, res);

    // 4. Verify Message Creation
    const messages = await Message.find({ chat_id: chatId }).sort({ createdAt: -1 });
    const loginPrompt = messages.find(m => m.message_type === "login_prompt");

    if (loginPrompt) {
        console.log("✅ Login Prompt message created successfully.");
        console.log("Content:", loginPrompt.message_content);
        console.log("Sender:", loginPrompt.sender);
        console.log("Anon User ID:", loginPrompt.anon_user_id);
    } else {
        console.error("❌ Login Prompt message NOT found.");
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: chatId });
    await Message.deleteMany({ chat_id: chatId });
    await VendorPreference.deleteOne({ customer_id: anonId });
    console.log("Cleanup done.");

    process.exit(0);
  } catch (error) {
    console.error("Error running verification:", error);
    process.exit(1);
  }
};

verifyVendorPrefTrigger();
