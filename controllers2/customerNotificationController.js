import CustomerNotification from "../models2/customerNotifications.js";

// Get all customer notifications
export const getCustomerNotifications = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const notifications = await CustomerNotification.find({ customer_id })
      .sort({ updated_at: -1, createdAt: -1 });
    
    const unreadCount = await CustomerNotification.countDocuments({ 
      customer_id, 
      read: false 
    });

    res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Mark all customer notifications as read
export const markCustomerNotificationsAsRead = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const result = await CustomerNotification.updateMany(
      { customer_id, read: false },
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

    const notification = await CustomerNotification.findByIdAndUpdate(
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

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ message: "customer_id is required" });
    }

    const unreadCount = await CustomerNotification.countDocuments({
      customer_id,
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

