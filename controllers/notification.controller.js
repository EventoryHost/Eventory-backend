import mongoose from "mongoose";
import VendorNotifications from "../models/vendorNotifications.js";
import CustomerNotification from "../models/customerNotifications.js";
import EMNotifications from "../models/emNotifications.js";

export const markAsReadAndDelete = async (req, res) => {
    console.log("[API] Request to delete notification 🟢");
    
    const { notificationId } = req.params;
    const { type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(notificationId) || !['vendor', 'customer', 'em'].includes(type)) {
        return res.status(400).json({ message: "Invalid Notification ID or type." });
    }

    let NotificationModel =
        type === "vendor" ? VendorNotifications :
        type === "customer" ? CustomerNotification :
        EMNotifications;

    try {
        // Fetch notification first so we can check message content
        const notif = await NotificationModel.findById(notificationId);
        if (!notif) {
            return res.status(200).json({ message: "Already deleted." });
        }

        // ✔ ALLOW DELETE ONLY IF it's worker-created unread-count notification
        const isUnreadCounter =
            notif.notification_type === "message_reminder" &&
            /^(\d+)\s+new\s+message/i.test(notif.message);  // regex pattern

        if (!isUnreadCounter) {
            console.log(`[API] ⛔ Not deleting (not a worker-generated unread notification). ID: ${notificationId}`);
            return res.status(200).json({
                message: "Notification kept (not an unread count message).",
            });
        }

        // Delete it
        await NotificationModel.findByIdAndDelete(notificationId);

        console.log(
          `[API] Deleted unread reminder 🔥 (ID: ${notificationId}, Type: ${type})`
        );

        return res.status(200).json({
            message: "Unread chat reminder deleted.",
            notificationId,
        });

    } catch (error) {
        console.error("[API Error] Delete failed:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
