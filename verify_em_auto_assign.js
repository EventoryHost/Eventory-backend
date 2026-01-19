import mongoose from "mongoose";
import { io as Client } from "socket.io-client";
import dotenv from "dotenv";
import Chat from "./models/chats.js";

dotenv.config();

const SOCKET_URL = "http://localhost:4000";

async function verifyEmAutoAssign() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const chatId = "CHAT_EM_TEST_" + Date.now();
    const anonId = "ANON_EM_TEST_" + Date.now();
    const emId = "EM_AUTO_" + Date.now();

    // 1. Create a Chat with NO em_id
    await Chat.create({
        chat_id: chatId,
        anon_customer_id: anonId,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE"
    });
    console.log(`Created Chat ${chatId} with no em_id`);

    // 2. Connect Socket
    const socket = Client(SOCKET_URL);
    
    await new Promise((resolve) => {
        socket.on("connect", resolve);
    });
    console.log("Socket connected");

    socket.emit("join_chat", { chat_id: chatId, sender: "em", chat_type: "anon_customer-admin" });

    // 3. Send Message as EM
    console.log("Sending message as EM...");
    socket.emit("send_message", {
        chat_id: chatId,
        chat_type: "anon_customer-admin",
        sender: "em",
        sender_id: emId,
        message_content: "Hello from EM Auto",
        message_type: "text"
    });

    // Wait for processing
    await new Promise(r => setTimeout(r, 2000));

    // 4. Verify Chat em_id
    const updatedChat = await Chat.findOne({ chat_id: chatId });
    if (updatedChat.em_id === emId) {
        console.log("✅ SUCCESS: Chat em_id was auto-assigned to", emId);
    } else {
        console.error("❌ FAILURE: Chat em_id is", updatedChat.em_id);
    }

    // Cleanup
    socket.disconnect();
    await Chat.deleteOne({ chat_id: chatId });
    console.log("Cleanup done");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyEmAutoAssign();
