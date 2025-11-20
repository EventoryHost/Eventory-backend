import vendorNotification from "../models2/vendorNotifications.js";

// ---------------------- GET VENDOR NOTIFICATIONS ----------------------
export const getVendorNotifications = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const notifications = await vendorNotification.find({ vendor_id }).sort({ updated_at: -1 });

    const unreadCount = await vendorNotification.countDocuments({
      vendor_id,
      read: false,
    });

    return res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching vendor notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// ---------------------- GET VENDOR NOTIFICATIONS BY SERVICE ----------------------
export const getVendorNotificationsByService = async (req, res) => {
  const { vendor_id, service_id } = req.params;

  try {
    if (!vendor_id || !service_id) {
      return res.status(400).json({ message: "Vendor ID and Service ID are required" });
    }

    const notifications = await vendorNotification.find({
      vendor_id,
      service_id,
    }).sort({ updated_at: -1 });

    const unreadCount = await vendorNotification.countDocuments({
      vendor_id,
      service_id,
      read: false,
    });

    return res.status(200).json({
      message: "Notifications retrieved successfully for the given service",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching vendor notifications by service:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};


// ---------------------- MARK VENDOR NOTIFICATION AS READ ----------------------
export const markVendorNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const updated = await vendorNotification.findByIdAndUpdate(
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
    console.error("❌ Error marking vendor notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notification as read", error: error.message });
  }
};

// ---------------------- MARK ALL VENDOR NOTIFICATIONS AS READ ----------------------
export const markAllVendorNotificationsAsRead = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    if (!vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const updated = await vendorNotification.updateMany(
      { vendor_id, read: false },
      { read: true }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      data: { modifiedCount: updated.modifiedCount },
    });
  } catch (error) {
    console.error("❌ Error marking all vendor notifications as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notifications as read", error: error.message });
  }
};