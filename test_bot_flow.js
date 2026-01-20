import mongoose from "mongoose";
import dotenv from "dotenv";
import { handleInteractiveMessage } from "./services/interactiveChatService.js";
import CustomerEnquiry from "./models/customerEnquiry.js";
import Message from "./models/message2.js";
import Chat from "./models/chats.js";

dotenv.config();

// Mock IO
const mockIo = {
    to: (room) => ({
        emit: (event, data) => {
            console.log(`[MOCK IO] Emitted to ${room}:`, data.message_content);
        }
    })
};

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const realAnonId = "ANON_REAL_" + Date.now();
    const fakeAnonId = "ANON_FAKE_" + Date.now();
    const chatId = "CHAT_BOT_TEST_" + Date.now();

    // Create Chat first (Required by new robust logic)
    await Chat.create({
        chat_id: chatId,
        anon_customer_id: realAnonId,
        chat_type: "anon_customer-admin",
        chat_status: "ACTIVE"
    });
    console.log(`Created Chat ${chatId} for ${realAnonId}`);

    console.log("--- Step 1: Send 'Birthday Party' (Event Type) with WRONG ID ---");
    // Pass fakeAnonId to simulate frontend sending wrong ID, but service should use realAnonId from Chat
    await handleInteractiveMessage(chatId, fakeAnonId, "Birthday Party", mockIo);
    
    // Check if Enquiry created with status OPEN for REAL ID
    let enquiry = await CustomerEnquiry.findOne({ anon_customer_id: realAnonId });
    if (enquiry && enquiry.status === "OPEN" && enquiry.event_type === "Birthday Party") {
        console.log("✅ Step 1 Passed: Enquiry created for REAL ID (Robustness confirmed)");
    } else {
        console.error("❌ Step 1 Failed: Enquiry not created for real ID", enquiry);
        return;
    }

    console.log("--- Step 2: Send 'Immediately' (Event Time) ---");
    await handleInteractiveMessage(chatId, fakeAnonId, "Immediately", mockIo);

    // Check if Enquiry updated to PROCESSING
    enquiry = await CustomerEnquiry.findOne({ anon_customer_id: realAnonId });
    if (enquiry && enquiry.status === "PROCESSING" && enquiry.event_time === "Immediately") {
        console.log("✅ Step 2 Passed: Enquiry updated to PROCESSING");
    } else {
        console.error("❌ Step 2 Failed: Enquiry not updated or wrong status", enquiry);
        return;
    }

    console.log("--- Step 3: Send Free Text (Should be ignored by bot) ---");
    // Capture console logs or check if new enquiry created
    const initialEnquiryCount = await CustomerEnquiry.countDocuments({ anon_customer_id: realAnonId });
    
    await handleInteractiveMessage(chatId, fakeAnonId, "This is a follow up message", mockIo);
    
    const finalEnquiryCount = await CustomerEnquiry.countDocuments({ anon_customer_id: realAnonId });
    
    if (initialEnquiryCount === finalEnquiryCount) {
        console.log("✅ Step 3 Passed: No new enquiry created (Bot ignored free text)");
    } else {
        console.error("❌ Step 3 Failed: New enquiry created (Bot looped)");
    }

    // Cleanup
    await CustomerEnquiry.deleteMany({ anon_customer_id: realAnonId });
    await Message.deleteMany({ chat_id: chatId });
    await Chat.deleteOne({ chat_id: chatId });
    console.log("Cleanup done");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
