import adminNotification from "../models2/emNotifications.js";

// ---------------------- GET EM NOTIFICATIONS ----------------------
export const getEMNotifications = async (req, res) => {
  const { em_id } = req.params;

  try {
    if (!em_id) {
      return res.status(400).json({ message: "EM ID is required" });
    }

    const notifications = await adminNotification.find({ em_id }).sort({ updated_at: -1 });

    const unreadCount = await adminNotification.countDocuments({
      em_id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching EM notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// ---------------------- MARK EM NOTIFICATION AS READ ----------------------
export const markEMNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const updated = await adminNotification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error marking EM notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notification as read", error: error.message });
  }
};

// ---------------------- MARK ALL EM NOTIFICATIONS AS READ ----------------------
export const markAllEMNotificationsAsRead = async (req, res) => {
  const { em_id } = req.params;

  try {
    if (!em_id) {
      return res.status(400).json({ message: "EM ID is required" });
    }

    const updated = await adminNotification.updateMany(
      { em_id, read: false },
      { read: true }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      data: { modifiedCount: updated.modifiedCount },
    });
  } catch (error) {
    console.error("❌ Error marking all EM notifications as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notifications as read", error: error.message });
  }
};
