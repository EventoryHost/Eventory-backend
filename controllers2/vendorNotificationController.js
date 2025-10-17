import VendorNotifications from "../models2/vendorNotifications.js";

// Get all vendor notifications
export const getVendorNotifications = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    console.log("🔔 Fetching notifications for vendor_id:", vendor_id);

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    const notifications = await VendorNotifications.find({ vendor_id })
      .sort({ updated_at: -1, createdAt: -1 });
    
    console.log(`📋 Found ${notifications.length} notifications for vendor ${vendor_id}`);
    
    const unreadCount = await VendorNotifications.countDocuments({ 
      vendor_id, 
      read: false 
    });

    console.log(`🔴 Unread count: ${unreadCount}`);

    res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching vendor notifications:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Mark all vendor notifications as read
export const markVendorNotificationsAsRead = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    const result = await VendorNotifications.updateMany(
      { vendor_id, read: false },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );

    res.status(200).json({
      message: "Notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

// Mark specific notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    if (!notification_id) {
      return res.status(400).json({ message: "notification_id is required" });
    }

    const notification = await VendorNotifications.findByIdAndUpdate(
      notification_id,
      { $set: { read: true, updated_at: new Date().toISOString() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// Delete a notification
export const deleteVendorNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;

    if (!notification_id) {
      return res.status(400).json({ message: "notification_id is required" });
    }

    const notification = await VendorNotifications.findByIdAndDelete(notification_id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    const unreadCount = await VendorNotifications.countDocuments({
      vendor_id,
      read: false,
    });

    res.status(200).json({
      message: "Unread count fetched successfully",
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

