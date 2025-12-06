import { Vendor } from "../models/vendor.js";
import vendorNotification from "../models/vendorNotifications.js";
import { ReduxCatererModel } from "../models/reduxModels/caterer.js";
import { ReduxDecoratorModel } from "../models/reduxModels/decorator.js";
import { MakeupArtistModel } from "../models/reduxModels/makeupArtist.js";
import { ReduxPhotographerVideographerModel } from "../models/reduxModels/photographerVideographer.js"; 
import { ReduxVenueProviderModel } from "../models/reduxModels/venueProvider.js";

// 📦 GET /api/vendors/all
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find(
      {},
      "vendor_id vendor_mobile email_address profile_picture services service_types highest_discount_ever_applied vendor_created_at vendor_updated_at"
    ).lean();

    const filteredVendors = vendors.filter((vendor) => {
      const hasServiceTypes =
        Array.isArray(vendor.service_types) && vendor.service_types.length > 0;
      const hasServices =
        Array.isArray(vendor.services) && vendor.services.length > 0;
      return hasServiceTypes || hasServices;
    });

    const transformedVendors = filteredVendors.map((vendor) => ({
      vendor_id: vendor.vendor_id,
      mobile: vendor.vendor_mobile || "N/A",
      email: vendor.email_address || "N/A",
      profile_picture: vendor.profile_picture || null,
      services: vendor.services || [],
      service_types: vendor.service_types.map((s) => ({
        name: s.service_name,
        id: s.service_id || "N/A",
        status: s.service_status || "Inactive",
      })),
      highest_discount_ever_applied: vendor.highest_discount_ever_applied || 0,
      vendor_created_at: vendor.vendor_created_at,
      vendor_updated_at: vendor.vendor_updated_at,
    }));

    res.status(200).json({
      success: true,
      total: transformedVendors.length,
      data: transformedVendors,
    });
  } catch (error) {
    console.error("Error fetching all vendors:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendors",
      error: error.message,
    });
  }
};

// 📦 GET /api/vendors/:vendor_id
export const getVendorById = async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📦 GET /api/vendors/:vendor_id/vendorNotification
export const getVendorNotifications = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const notifications = await vendorNotification
      .find({ vendor_id })
      .sort({ updated_at: -1 })
      .lean();

    const unreadCount = await vendorNotification.countDocuments({
      vendor_id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching vendor notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// 📦 PUT /api/vendors/:vendor_id/vendorNotification/mark-read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const result = await vendorNotification.updateMany(
      { vendor_id, read: false },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );
    res.status(200).json({
      success: true,
      message: "Notifications marked as read successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

// 📦 PATCH /api/vendors/:vendor_id/vendorNotification/mark-as-read
export const patchMarkNotificationsAsRead = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    await vendorNotification.updateMany(
      { vendor_id, read: false },
      { $set: { read: true, updated_at: new Date().toISOString() } }
    );
    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Error patching notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

export const getVendorFlowType = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    // Check in each Redux model
    const models = [
      { name: "caterer", model: ReduxCatererModel },
      { name: "decorator", model: ReduxDecoratorModel },
      { name: "Photographer-Videographer", model: ReduxPhotographerVideographerModel },
      { name: "venue_provider", model: ReduxVenueProviderModel },
      { name: "makeup_artist", model: MakeupArtistModel },
    ];

    for (const { name, model } of models) {
      const record = await model.findOne({ vendor_id }).lean();
      // console.log(record);
      if (record) {
        return res.status(200).json({
          success: true,
          message: "Vendor flow type found",
          flowType: name,
          service_id: record.service_id || null,
        });
      }
    }

    // If not found anywhere
    return res.status(404).json({
      success: false,
      message: "Vendor flow type not found",
    });
  } catch (error) {
    console.error("Error fetching vendor flow type:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendor flow type",
      error: error.message,
    });
  }
};