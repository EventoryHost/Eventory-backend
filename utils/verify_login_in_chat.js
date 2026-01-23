import mongoose from "mongoose";
import { handleInteractiveMessage } from "../services/interactiveChatService.js";
import Chat from "../models/chats.js";
import Message from "../models/message2.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";
import generateUniqueId from "../utils/generateId.js";

dotenv.config();

const verifyLoginInChat = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const chatId = generateUniqueId("CHAT");
    const anonId = generateUniqueId("ANON");

    // 1. Create a dummy chat
    const chat = await Chat.create({
      chat_id: chatId,
      anon_customer_id: anonId,
      chat_type: "anon_customer-admin",
      chat_status: "ACTIVE"
    });
    console.log(`Created dummy chat: ${chatId}`);

    // 2. Simulate LIKE_VENDOR message
    console.log("Simulating LIKE_VENDOR...");
    await handleInteractiveMessage(chatId, anonId, "LIKE_VENDOR:VEN123", null);

    // 3. Check if login_prompt message was created
    const messages = await Message.find({ chat_id: chatId }).sort({ createdAt: -1 });
    const loginPrompt = messages.find(m => m.message_type === "login_prompt");

    if (loginPrompt) {
        console.log("✅ Login Prompt message created successfully.");
        console.log("Content:", loginPrompt.message_content);
        console.log("Action:", loginPrompt.action);
    } else {
        console.error("❌ Login Prompt message NOT found.");
    }

    // Cleanup
    await Chat.deleteOne({ chat_id: chatId });
    await Message.deleteMany({ chat_id: chatId });
    console.log("Cleanup done.");

    process.exit(0);
  } catch (error) {
    console.error("Error running verification:", error);
    process.exit(1);
  }
};

verifyLoginInChat();
