import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import Chat from "./models/chats.js";
import Message from "./models/message2.js";

dotenv.config();

const BASE_URL = "http://localhost:4000/api";

async function verifyAdminChat() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const chatId = "CHAT_ADMIN_TEST_" + Date.now();
    const anonId = "ANON_ADMIN_TEST_" + Date.now();
    const emId = "EM_TEST_" + Date.now();

    // 1. Create a Chat with NO em_id (undefined)
    await Chat.create({
        chat_id: chatId,
        anon_customer_id: anonId,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE"
        // em_id is intentionally omitted
    });
    console.log(`Created Chat ${chatId} with no em_id`);

    // 2. Create a Message from Admin
    await Message.create({
        chat_id: chatId,
        chat_type: "anon_customer-admin",
        sender: "em",
        sender_id: emId,
        message_content: "Hello from Admin",
        message_type: "text"
    });
    console.log("Created Admin Message");

    // 3. Call PATCH /api/chats/chat/update-em
    console.log("Calling update-em...");
    const updateRes = await axios.patch(`${BASE_URL}/chats/chat/update-em`, {
        chat_id: chatId,
        em_id: emId
    });
    
    if (updateRes.status === 200 && updateRes.data.data.em_id === emId) {
        console.log("✅ PATCH update-em successful: em_id updated");
    } else {
        console.error("❌ PATCH update-em failed:", updateRes.data);
    }

    // 4. Call GET /api/chats/:chatId/messages
    console.log("Calling getMessages...");
    const messagesRes = await axios.get(`${BASE_URL}/chats/${chatId}/messages?chatType=anon_customer-admin`);
    
    const fetchedMsg = messagesRes.data.messages[0];
    if (fetchedMsg && fetchedMsg.sender_id === emId) {
        console.log("✅ GET messages successful: sender_id returned");
    } else {
        console.error("❌ GET messages failed or sender_id missing:", fetchedMsg);
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: chatId });
    await Message.deleteMany({ chat_id: chatId });
    console.log("Cleanup done");

  } catch (error) {
    console.error("Verification failed:", error.response ? error.response.data : error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdminChat();
