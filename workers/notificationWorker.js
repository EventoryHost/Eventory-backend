import mongoose from "mongoose";
import Chat2 from "../models2/chats.js";
import Message2 from "../models2/message2.js";
import EMNotifications from "../models2/emNotifications.js";
import CustomerNotification from "../models2/customerNotifications.js";
import VendorNotifications from "../models2/vendorNotifications.js";

// The desired interval (30 minutes)
const SCHEDULE_INTERVAL_MS = 30 * 60 * 1000; // REMEMBER TO SET THIS BACK TO 30 MINUTES AFTER TESTING!

/**
 * Creates chat notifications for recipients based on the number of unread messages.
 */
const createChatNotifications = async () => {
    console.log(`[Worker] Starting scheduled notification creation: ${new Date().toISOString()}`);

    try {
        const recentActivityThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
        const activeChats = await Chat2.find({
            chat_status: 'ACTIVE',
            last_message_updated_at: { $gte: recentActivityThreshold }
        }).lean();

        for (const chat of activeChats) {
            const latestMessage = await Message2.findOne({ chat_id: chat.chat_id })
                .sort({ message_sent_at: -1 })
                .lean();

            if (!latestMessage) continue;

            let recipients = [];
            let senderType;
            
            // Determine potential recipients and the sender type
            if (latestMessage.sender === 'customer') {
                senderType = 'customer';
                recipients.push({ type: 'vendor', id: chat.vendor_id, model: VendorNotifications, recipientKey: 'vendor_id' });
                if (chat.em_id) { 
                    recipients.push({ type: 'em', id: chat.em_id, model: EMNotifications, recipientKey: 'em_id' });
                }
            } else if (latestMessage.sender === 'vendor') {
                senderType = 'vendor';
                recipients.push({ type: 'customer', id: chat.customer_id, model: CustomerNotification, recipientKey: 'customer_id' });
                if (chat.em_id) {
                    recipients.push({ type: 'em', id: chat.em_id, model: EMNotifications, recipientKey: 'em_id' });
                }
            } else if (latestMessage.sender === 'em') {
                senderType = 'em';
                recipients.push({ type: 'customer', id: chat.customer_id, model: CustomerNotification, recipientKey: 'customer_id' });
                recipients.push({ type: 'vendor', id: chat.vendor_id, model: VendorNotifications, recipientKey: 'vendor_id' });
            }

            // Iterate through recipients to count and create notifications
            for (const recipient of recipients) {
                const query = {
                    chat_id: chat.chat_id,
                    read: false, // Must be unread
                    [recipient.recipientKey]: recipient.id
                };

                // --- 1. CRITICAL: CHECK FOR ANY EXISTING UNREAD NOTIFICATION ---
                const existingNotification = await recipient.model.findOne(query);

                if (existingNotification) {
                    // Notification already exists and is unread. SKIP CREATION.
                    console.log(`[Skipped] ❌❌❌ Unread notification already exists for ${recipient.type} for chat ${chat.chat_id}`);
                    continue; 
                }
                
                // --- 2. If NO unread notification exists, proceed to count and create ---

                // We assume the user has read everything up to the last time they entered the chat, 
                // but since we don't have a 'last_read' field, we count messages from the sender type.
                const unreadCount = await Message2.countDocuments({
                    chat_id: chat.chat_id,
                    sender: senderType,
                    // If no existing notification, we assume all messages from the sender are new since the chat was opened.
                    // (Note: This is an approximation due to model limitations)
                });
                
                if (unreadCount > 0) {
                    const notificationMessage = `${unreadCount} new message${unreadCount > 1 ? 's' : ''} in chat ${chat.chat_id}.`;
                    
                    // Create the NEW notification
                    await recipient.model.create({
                        [recipient.recipientKey]: recipient.id,
                        chat_id: chat.chat_id,
                        ...(recipient.type === 'em' && chat.order_id && { order_id: chat.order_id }), 
                        service_id: chat.service_id,
                        notification_type: 'chat_message',
                        message: notificationMessage
                    });
                    console.log(`[Created] 🏳️🏳️🏳️ ${unreadCount} new messages notification for ${recipient.type} (${recipient.id}) for chat ${chat.chat_id}`);
                }
            }
        }
    } catch (error) {
        console.error("[Worker Error] Failed to create chat notifications:", error);
    }
};

export const startNotificationWorker = () => {
    setInterval(async () => {
        await createChatNotifications();
    }, SCHEDULE_INTERVAL_MS);

    console.log(`[Worker] Notification scheduler initialized to run every ${SCHEDULE_INTERVAL_MS / 60000} minutes. Cleanup is API-driven.`);
};