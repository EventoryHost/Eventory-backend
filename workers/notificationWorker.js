import mongoose from "mongoose";
import Chat2 from "../models/chats.js";
import Message2 from "../models/message2.js";
import EMNotifications from "../models/emNotifications.js";
import CustomerNotification from "../models/customerNotifications.js";
import VendorNotifications from "../models/vendorNotifications.js";

var SCHEDULE_INTERVAL_MS = 2 * 60 * 60 * 1000;

// var SCHEDULE_INTERVAL_MS = 2 * 10 * 1000;

/**
 * Creates chat notifications for recipients based on unread messages.
 */
const createChatNotifications = async () => {
    console.log(`[Worker] Running chat notification scan: ${new Date().toISOString()}`);

    try {
        const recentActivityThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const activeChats = await Chat2.find({
            chat_status: "ACTIVE",
            last_message_updated_at: { $gte: recentActivityThreshold }
        }).lean();

        for (const chat of activeChats) {

            const latestMessage = await Message2.findOne({ chat_id: chat.chat_id })
                .sort({ message_sent_at: -1 })
                .lean();

            if (!latestMessage) continue;

            let recipients = [];
            const senderType = latestMessage.sender;

            // ------------------------------------------------------
            // FIXED LOGIC BASED ON YOUR RULES + chat_type
            // ------------------------------------------------------

            if (senderType === "customer") {
                // Customer → Notify ONLY admin
                if (chat.em_id) {
                    recipients.push({
                        type: 'em',
                        id: chat.em_id,
                        model: EMNotifications,
                        recipientKey: 'em_id',
                        needsOrderId: true
                    });
                }
            }

            else if (senderType === "vendor") {
                console.log(`em is ${chat.em_id}`);
                // Vendor → Notify ONLY admin
                if (chat.em_id) {
                    recipients.push({
                        type: 'em',
                        id: chat.em_id,
                        model: EMNotifications,
                        recipientKey: 'em_id',
                        needsOrderId: true
                    });
                }
            }

            else if (senderType === "em") {
                // Admin sent message → notify ONLY the relevant party based on chat_type
                if (chat.chat_type === "vendor-admin") {
                    // Notify vendor only
                    recipients.push({
                        type: "vendor",
                        id: chat.vendor_id,
                        model: VendorNotifications,
                        recipientKey: "vendor_id"
                    });
                }
                else if (chat.chat_type === "customer-admin") {
                    // Notify customer only
                    recipients.push({
                        type: "customer",
                        id: chat.customer_id,
                        model: CustomerNotification,
                        recipientKey: "customer_id"
                    });
                }
            }

            // ------------------------------------------------------
            // CREATE NOTIFICATION IF NOT EXISTS
            // ------------------------------------------------------

            for (const recipient of recipients) {

                const query = {
                    chat_id: chat.chat_id,
                    read: false,
                    [recipient.recipientKey]: recipient.id
                };

                const existing = await recipient.model.findOne(query);

                console.log(`existing: ${existing}`);

                if (existing) {
                    console.log(`[Skip] Existing unread notif for ${recipient.type} in chat ${chat.chat_id}`);
                    continue;
                }

                const unreadCount = await Message2.countDocuments({
                    chat_id: chat.chat_id,
                    sender: senderType
                });

                if (unreadCount === 0) continue;

                await recipient.model.create({
                    [recipient.recipientKey]: recipient.id,
                    chat_id: chat.chat_id,
                    service_id: chat.service_id,
                    notification_type: 'message_reminder',
                    message: `${unreadCount} new message${unreadCount > 1 ? "s" : ""} in chats.`,
                    order_id: chat.order_id
                });

                //Fcm Trigger for Vendor Notificaation
                if (recipient.type === 'vendor') {
                    sendFCMNotificationToVendor({
                        vendorId: recipient.id,
                        notification: {
                            title: "New Chat Messages",
                            body: notificationMessage // e.g., "3 new messages in chats."
                        },
                        data: {
                            type: "message_reminder",
                            chat_id: chat.chat_id,
                            vendor_id: vendorId,
                            message: notificationMessage
                        }
                    }).then(result => {
                        console.log(`FCM notifications sent to vendor ${recipient.id} for chat ${chat.chat_id}`, result);
                    }).catch(error => {
                        console.error("Failed to send FCM notification for new messages:", error);
                    });
                }


                console.log(
                    `[Created] ✅✅✅ Notification → ${recipient.type} (${recipient.id}) for chat ${chat.chat_id}`
                );
            }
        }

    } catch (error) {
        console.error("[Worker Error] Failed:", error);
    }
};

export const startNotificationWorker = () => {
    setInterval(createChatNotifications, SCHEDULE_INTERVAL_MS);
    console.log(`[Worker] Notification worker running every ${SCHEDULE_INTERVAL_MS / 1000}s`);
};
