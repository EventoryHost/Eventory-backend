import { DeviceToken } from "../models/deviceToken.js";
import { Vendor } from "../models/vendor.js";

// Store device token for a vendor
const storeDeviceToken = async (req, res) => {
  try {
    const { vendorId, deviceToken, deviceType, deviceId } = req.body;

    // Validate required fields
    if (!vendorId || !deviceToken) {
      return res.status(400).json({
        message: "vendorId and deviceToken are required"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findOne({ vendor_id: vendorId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Use upsert to either update existing token or create new one
    const result = await DeviceToken.findOneAndUpdate(
      { vendorId: vendor._id, deviceToken }, // Find by vendor and token
      {
        vendorId: vendor._id,
        deviceToken,
        deviceType: deviceType || "android",
        deviceId
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      message: "Device token stored successfully",
      data: result
    });

  } catch (error) {
    console.error("Error storing device token:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Device token already exists for this vendor"
      });
    }

    res.status(500).json({ error: error.message });
  }
};

// Remove device token (for logout from specific device)
const removeDeviceToken = async (req, res) => {
  try {
    const { deviceToken, deviceId } = req.body;

    if (!deviceToken && !deviceId) {
      return res.status(400).json({
        message: "Either deviceToken or deviceId is required"
      });
    }

    let query = {};
    if (deviceToken) {
      query.deviceToken = deviceToken;
    }
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const deletedToken = await DeviceToken.findOneAndDelete(query);

    if (!deletedToken) {
      return res.status(404).json({
        message: "Device token not found"
      });
    }

    res.status(200).json({
      message: "Device token removed successfully"
    });

  } catch (error) {
    console.error("Error removing device token:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all device tokens for a vendor
const getDeviceTokens = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({
        message: "vendorId is required"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findOne({ vendor_id: vendorId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const deviceTokens = await DeviceToken.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Device tokens retrieved successfully",
      data: deviceTokens
    });

  } catch (error) {
    console.error("Error getting device tokens:", error);
    res.status(500).json({ error: error.message });
  }
};

// Remove all device tokens for a vendor (useful for account deletion or logout from all devices)
const removeAllDeviceTokens = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        message: "vendorId is required"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findOne({ vendor_id: vendorId });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const result = await DeviceToken.deleteMany({ vendorId: vendor._id });

    res.status(200).json({
      message: `${result.deletedCount} device tokens removed successfully`
    });

  } catch (error) {
    console.error("Error removing all device tokens:", error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  storeDeviceToken,
  removeDeviceToken,
  getDeviceTokens,
  removeAllDeviceTokens
};
