import Message from "../models/message2.js";
import CustomerEnquiry from "../models/customerEnquiry.js";
import Chat from "../models/chats.js";
import generateUniqueId from "../utils/generateId.js";
import AnonCustomerOrder from "../models/anonCustomerOrder.js";
import CustomerNotification from "../models/customerNotifications.js";

export const handleInteractiveMessage = async (chatId, socketSenderId, messageContent, io) => {
    try {
        console.log(`[DEBUG] handleInteractiveMessage entry: chatId=${chatId}, content="${messageContent}"`);
        
        // Fetch Chat to get the correct anon_customer_id or customer_id
        const chat = await Chat.findOne({ chat_id: chatId });
        if (!chat) {
            console.error(`Chat not found: ${chatId}`);
            return;
        }

        let userId = chat.customer_id || chat.anon_customer_id;
        let isCustomer = !!chat.customer_id;
        let enquiry; // Declare once at top level

        // Common Query for existing enquiries
        let enquiryQuery = { 
            status: { $in: ["OPEN", "PROCESSING"] } 
        };
        if (isCustomer) {
            enquiryQuery.customer_id = userId;
        } else {
            enquiryQuery.anon_customer_id = userId;
        }


        // 1. Check for Vendor Card Actions (Like/Dislike) or Order Confirmation
        if (messageContent.startsWith("LIKE_VENDOR:") || messageContent.startsWith("DISLIKE_VENDOR:")) {
            const [action, vendorId] = messageContent.split(":");
            console.log(`User ${userId} performed ${action} on vendor ${vendorId}`);

            if (action === "LIKE_VENDOR") {
                // Send "Order Summary"
                const orderSummaryMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: chat.chat_type,
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "Great choice! Here is the summary of your order.",
                    message_type: "order_summary",
                    card_data: {
                        vendor_id: vendorId,
                        items: [{ name: "Standard Package", price: 5000, quantity: 1 }],
                        total: 5000,
                        tax: 900,
                        grand_total: 5900
                    },
                    action: "confirm_order"
                });
                if (io) io.to(`${chatId}-${chat.chat_type}`).emit("new_message", orderSummaryMsg.toObject());

                // Trigger customer notification
                await triggerCustomerNotification(userId, chatId, "Great choice! Here is the summary of your order.", io);

                // Send Confirmation Options
                const confirmMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: chat.chat_type,
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "Would you like to proceed with this order?",
                    message_type: "options",
                    options: [
                        { label: "Confirm Order", value: `CONFIRM_ORDER:${vendorId}` },
                        { label: "Cancel", value: "CANCEL_ORDER" }
                    ]
                });
                if (io) io.to(`${chatId}-${chat.chat_type}`).emit("new_message", confirmMsg.toObject());
                
                // Trigger customer notification
                await triggerCustomerNotification(userId, chatId, "Would you like to proceed with this order?", io);
            } else {
                const ackMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: chat.chat_type,
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "Got it. We'll look for other options.",
                    message_type: "text"
                });
                if (io) io.to(`${chatId}-${chat.chat_type}`).emit("new_message", ackMsg.toObject());

                // Trigger customer notification
                await triggerCustomerNotification(userId, chatId, "Got it. We'll look for other options.", io);
            }
            return;
        }

        if (messageContent.startsWith("CONFIRM_ORDER:")) {
            // Update order status to approved
            try {
                const order = await AnonCustomerOrder.findOneAndUpdate(
                    { chat_id: chatId, order_status: { $ne: 'converted' } },
                    { $set: { order_status: 'approved' } },
                    { new: true, sort: { created_at: -1 } }
                );
                if (order) {
                    console.log(`[ORDER] Order ${order.anon_order_id} marked as approved via chat confirmation.`);
                }
            } catch (err) {
                console.error("[ERROR] Failed to update order status on confirmation:", err);
            }

             const loginMsg = await Message.create({
                chat_id: chatId,
                chat_type: chat.chat_type,
                sender: "admin",
                sender_id: "admin",
                message_content: "To save your order and proceed to checkout, please login or sign up.",
                message_type: "login_prompt",
                action: "login_redirect"
            });
            if (io) io.to(`${chatId}-${chat.chat_type}`).emit("new_message", loginMsg.toObject());

            // Trigger customer notification
            await triggerCustomerNotification(userId, chatId, "To save your order and proceed to checkout, please login or sign up.", io);
            return;
        }

        // 2. Step-by-Step Interactive Flow Logic
        const eventTypes = ["wedding", "birthday", "corporate", "anniversary", "other"];
        const normalizedContent = messageContent?.trim().toLowerCase();
        const isEventTypeSelection = eventTypes.includes(normalizedContent);

        console.log(`[DEBUG] Flow check: isEventTypeSelection=${isEventTypeSelection}, normalizedContent="${normalizedContent}"`);

        // --- STEP 1: EVENT TYPE SELECTION ---
        // Flow condition: Either it's a known event type, OR we don't have an active enquiry yet
        // If we don't have an enquiry, this first message MUST be the event type (specified as 'Other' or custom)
        enquiry = await CustomerEnquiry.findOne(enquiryQuery).sort({ created_at: -1 });

        if (!enquiry || isEventTypeSelection) {
            if (enquiry) {
                enquiry.event_type = messageContent;
                enquiry.status = "OPEN"; // Reset to OPEN so next message is treated as Time
                await enquiry.save();
                console.log(`[FLOW 4] Event type selected (Update): "${messageContent}" for chat_id=${chatId}`);
            } else {
                enquiry = await CustomerEnquiry.create({
                    enquiry_id: generateUniqueId("ENQ"),
                    [isCustomer ? "customer_id" : "anon_customer_id"]: userId,
                    event_type: messageContent,
                    status: "OPEN"
                });
                console.log(`[FLOW 4] Event type selected (New): "${messageContent}" for chat_id=${chatId}`);
            }

            // Send "How Soon" Options
            setTimeout(async () => {
                const timeOptionsMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: chat.chat_type,
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "How soon is your event?",
                    message_type: "options",
                    options: [
                        { label: "Immediately", value: "Immediately" },
                        { label: "After a month", value: "After a month" },
                        { label: "Just exploring", value: "Just exploring" }
                    ]
                });

                if (io) {
                    io.to(`${chatId}-${chat.chat_type}`).emit("new_message", timeOptionsMsg.toObject());
                    
                    // Trigger customer notification
                    await triggerCustomerNotification(userId, chatId, "How soon is your event?", io);
                    console.log(`[FLOW 5] Event time options sent: chat_id=${chatId}`);
                }
            }, 1000);

            return;
        }

        // --- STEP 2+: HANDLE EXISTING ENQUIRY ---
        // (Enquiry already exists and it's not a re-selection of event type)

        if (enquiry) {
            if (enquiry.status === "PROCESSING") {
                console.log(`[DEBUG] Enquiry ${enquiry.enquiry_id} is already in PROCESSING status. Skipping interactive flow.`);
                return;
            }

            // If status is OPEN, we assume this message is the Timing selection
            console.log(`[FLOW 6] Event time selected: "${messageContent}" for chat_id=${chatId}`);
            console.log(`[FLOW] Step 2: Saving event time "${messageContent}" for enquiry ${enquiry.enquiry_id}`);
            enquiry.event_time = messageContent;
            enquiry.status = "PROCESSING";
            await enquiry.save();

            // Send Follow-up messages
            setTimeout(async () => {
                // 1. Assigning EM message
                const assigningMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: chat.chat_type,
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "We're assigning an event manager to assist you with your query.",
                    message_type: "text"
                });
                if (io) io.to(`${chatId}-${chat.chat_type}`).emit("new_message", assigningMsg.toObject());

                // Trigger customer notification
                await triggerCustomerNotification(userId, chatId, "We're assigning an event manager to assist you with your query.", io);

                // 2. Processing / Review prompt
                setTimeout(async () => {
                    const processingMsg = await Message.create({
                        chat_id: chatId,
                        chat_type: chat.chat_type,
                        sender: "admin",
                        sender_id: "admin",
                        message_content: "I'm working on your query. It may take a little while. Meanwhile, you can check our reviews.",
                        message_type: "options",
                        action: "check_reviews",
                        options: [
                            { label: "Check Reviews", value: "CHECK_REVIEWS_ACTION" }
                        ]
                    });
                    if (io) {
                        io.to(`${chatId}-${chat.chat_type}`).emit("new_message", processingMsg.toObject());
                        
                        // Trigger customer notification
                        await triggerCustomerNotification(userId, chatId, "I'm working on your query. It may take a little while. Meanwhile, you can check our reviews.", io);
                        console.log(`[FLOW 7] Reviews and connecting message sent: chat_id=${chatId}`);
                    }
                }, 1500);

            }, 800);

            return;
        }

    } catch (error) {
        console.error("Error in handleInteractiveMessage:", error);
    }
};

// Helper to trigger customer notification
const triggerCustomerNotification = async (customerId, chatId, messageContent, io) => {
    try {
        const notification = new CustomerNotification({
            customer_id: customerId,
            chat_id: chatId,
            notification_type: 'chat_message',
            message: `New message from Eventory: ${messageContent.length > 50 ? messageContent.substring(0, 47) + '...' : messageContent}`,
            read: false,
        });
        await notification.save();

        if (io) {
            const customerRoom = `notifications-${customerId}`;
            io.to(customerRoom).emit("new_notification", {
                type: 'chat_message',
                chat_id: chatId,
                message: notification.message,
                timestamp: notification.createdAt,
            });
        }
    } catch (err) {
        console.error("Failed to trigger automated customer notification:", err);
    }
};
