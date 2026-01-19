import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import Chat from "./models/chats.js";

dotenv.config();

const BASE_URL = "http://localhost:4000/api";

async function verifyEmExposure() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const chatId = "CHAT_EXPOSE_TEST_" + Date.now();
    const anonId = "ANON_EXPOSE_TEST_" + Date.now();
    const emId = "EM_EXPOSE_" + Date.now();

    // 1. Create a Chat WITH em_id
    await Chat.create({
        chat_id: chatId,
        anon_customer_id: anonId,
        em_id: emId,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE"
    });
    console.log(`Created Chat ${chatId} with em_id ${emId}`);

    // 2. Test getAnonymousChatStatus
    console.log("Testing getAnonymousChatStatus...");
    const statusRes = await axios.get(`${BASE_URL}/anon-chats/${anonId}/status`);
    if (statusRes.data.status === "ACTIVE" && statusRes.data.em_id === emId) {
        console.log("✅ getAnonymousChatStatus: em_id returned correctly");
    } else {
        console.error("❌ getAnonymousChatStatus FAILED:", statusRes.data);
    }

    // 3. Test getChatDetails
    console.log("Testing getChatDetails...");
    const detailsRes = await axios.get(`${BASE_URL}/chats/${chatId}/details`);
    if (detailsRes.data.success && detailsRes.data.em_id === emId) {
        console.log("✅ getChatDetails: em_id returned correctly");
    } else {
        console.error("❌ getChatDetails FAILED:", detailsRes.data);
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: chatId });
    console.log("Cleanup done");

  } catch (error) {
    console.error("Verification failed:", error.response ? error.response.data : error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyEmExposure();
