import mongoose from "mongoose";
import VendorNotifications from "../models2/vendorNotifications.js";
import CustomerNotification from "../models2/customerNotifications.js";
import EMNotifications from "../models2/emNotifications.js";
/**
 * Finds a notification by ID and type, and immediately deletes it.
 * This is the crucial function for the "delete after reading" requirement.
 */
export const markAsReadAndDelete = async (req, res) => {
    console.log("[API] Received request ✅✅✅✅ to mark notification as read and delete it.");
    const { notificationId } = req.params;
    const { type } = req.query; // e.g., ?type=vendor, ?type=customer, or ?type=em

    if (!mongoose.Types.ObjectId.isValid(notificationId) || !['vendor', 'customer', 'em'].includes(type)) {
        return res.status(400).json({ message: "Invalid Notification ID or type. Must be vendor, customer, or em." });
    }

    let NotificationModel;
    switch (type) {
        case 'vendor':
            NotificationModel = VendorNotifications;
            break;
        case 'customer':
            NotificationModel = CustomerNotification;
            break;
        case 'em':
            NotificationModel = EMNotifications;
            break;
        default:
            return res.status(500).json({ message: "Internal error: Model selection failed." });
    }

    try {
        // --- ONLY DELETE THE SPECIFIC DOCUMENT ---
        const deletedNotif = await NotificationModel.findByIdAndDelete(notificationId);

        if (!deletedNotif) {
            // It might already have been deleted (which is fine)
            return res.status(200).json({ 
                message: "Notification not found or already deleted. Action completed." 
            });
        }
        
        console.log(`[API] Deleted read notification 🐦‍🔥🐦‍🔥🐦‍🔥 (ID: ${notificationId}, Type: ${type})`);
        
        return res.status(200).json({ 
            message: "Notification deleted successfully.",
            notificationId: notificationId
        });

    } catch (error) {
        console.error(`[API Error] Failed to delete notification ${notificationId}:`, error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};