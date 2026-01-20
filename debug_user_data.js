import mongoose from "mongoose";
import dotenv from "dotenv";
import Chat from "./models/chats.js";
import CustomerEnquiry from "./models/customerEnquiry.js";

dotenv.config();

async function debugUserData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const chatId = "CHAT1601202615304595042CBFB";
    const anonId = "ANON160120261530459205051E2";

    console.log(`--- Inspecting Chat: ${chatId} ---`);
    const chats = await Chat.find({ chat_id: chatId });
    console.log(`Found ${chats.length} chat(s):`);
    chats.forEach(c => {
        console.log(`- ID: ${c._id}, AnonID: ${c.anon_customer_id}, Status: ${c.chat_status}`);
    });

    console.log(`\n--- Inspecting Enquiries for AnonID: ${anonId} ---`);
    const enquiries = await CustomerEnquiry.find({ anon_customer_id: anonId });
    console.log(`Found ${enquiries.length} enquiry(s):`);
    enquiries.forEach(e => {
        console.log(`- ID: ${e._id}, Type: ${e.event_type}, Time: ${e.event_time}, Status: ${e.status}`);
    });

  } catch (error) {
    console.error("Debug failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserData();
