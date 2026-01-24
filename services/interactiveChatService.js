import Message from "../models/message2.js";
import CustomerEnquiry from "../models/customerEnquiry.js";
import Chat from "../models/chats.js";

export const handleInteractiveMessage = async (chatId, socketSenderId, messageContent, io) => {
    try {
        // Fetch Chat to get the correct anon_customer_id
        const chat = await Chat.findOne({ chat_id: chatId });
        if (!chat) {
            console.error(`Chat not found: ${chatId}`);
            return;
        }
        const anonCustomerId = chat.anon_customer_id;

        // 1. Check for Vendor Card Actions (Like/Dislike) or Order Confirmation
        if (messageContent.startsWith("LIKE_VENDOR:") || messageContent.startsWith("DISLIKE_VENDOR:")) {
            const [action, vendorId] = messageContent.split(":");
            console.log(`User ${anonCustomerId} performed ${action} on vendor ${vendorId}`);

            if (action === "LIKE_VENDOR") {
                // Send "Order Summary"
                const orderSummaryMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: "anon_customer-admin",
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
                if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", orderSummaryMsg);

                // Send Confirmation Options
                const confirmMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: "anon_customer-admin",
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "Would you like to proceed with this order?",
                    message_type: "options",
                    options: [
                        { label: "Confirm Order", value: `CONFIRM_ORDER:${vendorId}` },
                        { label: "Cancel", value: "CANCEL_ORDER" }
                    ]
                });
                if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", confirmMsg);
            } else {
                const ackMsg = await Message.create({
                    chat_id: chatId,
                    chat_type: "anon_customer-admin",
                    sender: "admin",
                    sender_id: "admin",
                    message_content: "Got it. We'll look for other options.",
                    message_type: "text"
                });
                if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", ackMsg);
            }
            return;
        }

        if (messageContent.startsWith("CONFIRM_ORDER:")) {
             const loginMsg = await Message.create({
                chat_id: chatId,
                chat_type: "anon_customer-admin",
                sender: "admin",
                sender_id: "admin",
                message_content: "To save your order and proceed to checkout, please login or sign up.",
                message_type: "login_prompt",
                action: "login_redirect"
            });
            if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", loginMsg);
            return;
        }

        // 2. Check for Existing Enquiry (Status: OPEN or PROCESSING)
        let enquiry = await CustomerEnquiry.findOne({ 
            anon_customer_id: anonCustomerId, 
            status: { $in: ["OPEN", "PROCESSING"] } 
        }).sort({ created_at: -1 });

        if (enquiry) {
            if (enquiry.status === "PROCESSING") {
                // User is already in processing state, just ignore (it's a normal chat message)
                // Do NOT trigger "How soon" or "Event Type" flow again.
                return;
            }

            // Status is OPEN, so we expect Event Time
            enquiry.event_time = messageContent;
            enquiry.status = "PROCESSING";
            await enquiry.save();

            // Send "Processing" message
            const processingMsg = await Message.create({
                chat_id: chatId,
                chat_type: "anon_customer-admin",
                sender: "admin",
                sender_id: "admin",
                message_content: "I'm working on your query. It may take a little while. Meanwhile, you can check our reviews.",
                message_type: "text",
                action: "check_reviews"
            });
            if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", processingMsg);
            
            // Send "Check Reviews" button
            const reviewBtnMsg = await Message.create({
                 chat_id: chatId,
                chat_type: "anon_customer-admin",
                sender: "admin",
                sender_id: "admin",
                message_content: "Check Reviews",
                message_type: "options",
                options: [
                    { label: "Check Reviews", value: "CHECK_REVIEWS_ACTION" }
                ]
            });
            if (io) io.to(`${chatId}-anon_customer-admin`).emit("new_message", reviewBtnMsg);
            return;
        }

        // 3. No Open/Processing Enquiry -> Treat Input as Event Type
        // Handle "Other" case: Don't create enquiry yet, let them type.
        if (messageContent === "Other") {
            // Optional: Send a prompt "Please specify your event type"
            // For now, we do nothing and wait for the next message which will be the manual entry.
            return;
        }

        // Create Enquiry with this message as Event Type
        enquiry = await CustomerEnquiry.create({
            anon_customer_id: anonCustomerId,
            event_type: messageContent,
            status: "OPEN"
        });

        // Send "Event Time" Options
        const timeOptionsMsg = await Message.create({
            chat_id: chatId,
            chat_type: "anon_customer-admin",
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

        // Emit Socket Event
        if (io) {
            io.to(`${chatId}-anon_customer-admin`).emit("new_message", timeOptionsMsg);
        }

    } catch (error) {
        console.error("Error in handleInteractiveMessage:", error);
    }
};
