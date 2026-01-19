import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "./models/chats.js";
import Message from "./models/message2.js";
import fetch from "node-fetch";

dotenv.config();

const BASE_URL = "http://localhost:4005";

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Create a dummy anonymous chat
    const anonId = "ANON_TEST_" + Date.now();
    const chatId = "CHAT_TEST_" + Date.now();
    
    const chat = await Chat.create({
        chat_id: chatId,
        anon_customer_id: anonId,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE",
        chat_created_at: new Date(),
        last_message_updated_at: new Date()
    });
    console.log("Created dummy chat:", chatId);

    // 2. Add a message
    await Message.create({
        chat_id: chatId,
        chat_type: "anon_customer-admin",
        sender: "anonymous_customer",
        sender_id: anonId,
        message_content: "Hello Admin, this is a test.",
        message_type: "text"
    });
    console.log("Created dummy message");

    // 3. Call the API
    const response = await fetch(`${BASE_URL}/api/anon-chats/all?limit=100`);
    const data = await response.json();

    console.log("API Response Success:", data.success);
    
    const foundChat = data.data.find(c => c.chat_id === chatId);
    
    if (foundChat) {
        console.log("✅ Found created chat in API response");
        console.log("Chat Data:", foundChat);
        
        if (foundChat.last_message === "Hello Admin, this is a test.") {
            console.log("✅ Last message matches");
        } else {
            console.error("❌ Last message mismatch:", foundChat.last_message);
        }
        
        if (foundChat.status === "active") {
             console.log("✅ Status matches");
        } else {
             console.error("❌ Status mismatch:", foundChat.status);
        }

    } else {
        console.error("❌ Chat not found in API response");
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: chatId });
    await Message.deleteMany({ chat_id: chatId });
    console.log("Cleanup done");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
