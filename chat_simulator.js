import { io } from "socket.io-client";

// --- CONFIGURATION ---
const SERVER_URL = "http://localhost:4000"; // Your backend server
const CHAT_ID = "QUO11102025111727007"; // Must exist in Chat2 collection
const DELAY_MS = 1500; // Delay between messages

const CUSTOMER_TYPE = "customer";
const VENDOR_TYPE = "vendor";
const EM_TYPE = "em";

// Helper for delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a Socket.IO client and join chat room
 */
const createChatClient = (sender) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🔌 Attempting to connect ${sender} client...`);

    const socket = io(SERVER_URL, {
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log(`✅ ${sender} client connected with ID: ${socket.id}`);
      socket.emit("join_chat", { chat_id: CHAT_ID, sender });
    });

    socket.on("joined", (message) => {
      console.log(`- ${sender}: ${message}`);
      resolve(socket);
    });

    socket.on("new_message", (message) => {
      const {
        sender,
        message_content,
        message_type,
        attachment_url,
        parent_message_id,
      } = message;

      console.log(
        `[${CHAT_ID}] RECEIVED (${sender.toUpperCase()} | ${message_type}): ${
          message_type === "image" ? attachment_url : message_content
        }${parent_message_id ? ` ↩️ (reply to ${parent_message_id})` : ""}`
      );
    });

    socket.on("error", (error) => {
      console.error(`❌ ${sender} ERROR: ${error}`);
      reject(new Error(error));
    });

    socket.on("disconnect", () => {
      console.log(`\n🔌 ${sender} client disconnected.`);
    });
  });
};

/**
 * Send message with correct schema field names
 */
const sendMessage = async (
  socket,
  sender,
  message_content,
  message_type = "text",
  attachment_url = null,
  parent_message_id = null
) => {
  console.log(`\n>> Sending as ${sender}: "${message_content}"`);

  const client_message_id =
    Date.now().toString() + Math.random().toString(36).substring(2, 7);

  socket.emit(
    "send_message",
    {
      chat_id: CHAT_ID,
      sender, // 'customer' | 'vendor' | 'em'
      message_content,
      message_type,
      attachment_url,
      parent_message_id,
      parent_message_content: parent_message_id
        ? "Parent message content placeholder"
        : null,
      parent_sender: parent_message_id ? "vendor" : null,
      client_message_id,
    },
    (error, ackData) => {
      if (error) {
        console.error(`   [ACK ERROR] ${sender} failed to send: ${error}`);
      } else {
        console.log(
          `   [ACK SUCCESS] ${sender} message sent. DB ID: ${ackData?._id}`
        );
      }
    }
  );
};

// --- Simulation Flow ---
const simulateChat = async () => {
  console.log("--- Starting Chat Simulation ---");
  try {
    // Connect all clients
    const [customerSocket, vendorSocket, emSocket] = await Promise.all([
      createChatClient(CUSTOMER_TYPE),
      createChatClient(VENDOR_TYPE),
      createChatClient(EM_TYPE),
    ]);

    await sleep(DELAY_MS);

    // --- Start Conversation ---

    // 1️⃣ Customer initiates
    await sendMessage(
      customerSocket,
      CUSTOMER_TYPE,
      "Hello, I'd like to confirm the details for the catering service next month."
    );
    await sleep(DELAY_MS);

    // 2️⃣ Vendor replies
    await sendMessage(
      vendorSocket,
      VENDOR_TYPE,
      "Yes, we are finalizing the menu. Can you send me the final count of attendees, please?"
    );
    await sleep(DELAY_MS);

    // 3️⃣ Customer sends an image
    await sendMessage(
      customerSocket,
      CUSTOMER_TYPE,
      "Here is the event layout and final guest list (Image attached).",
      "image",
      "https://d1u34m45xfa3ar.cloudfront.net/layout_final.jpg"
    );
    await sleep(DELAY_MS);

    // 4️⃣ EM intervenes
    await sendMessage(
      emSocket,
      EM_TYPE,
      "EM Notice: I'll be monitoring this chat to ensure timely responses. All media has been reviewed."
    );
    await sleep(DELAY_MS);

    // 5️⃣ Vendor replies to a parent message
    const dummyParentId = "60c8e0e7a1b3c4d5e6f7a8b9";
    await sendMessage(
      vendorSocket,
      VENDOR_TYPE,
      "Acknowledged! We'll integrate the new attendee count now and send a revised proposal.",
      "text",
      null,
      dummyParentId
    );

    await sleep(DELAY_MS * 3);

    console.log("\n--- Simulation Complete ---");

    // Disconnect clients
    customerSocket.disconnect();
    vendorSocket.disconnect();
    emSocket.disconnect();
  } catch (error) {
    console.error("Simulation failed:", error);
  }
};

simulateChat();
