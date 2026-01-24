import VendorPreference from "../models/vendorPreference.js";

/**
 * Add or update vendor preference (like/reject)
 * @route POST /api/vendor-preferences
 */
export const setVendorPreference = async (req, res) => {
  try {
    const { customer_id, vendor_id, service_id, preference_type } = req.body;

    if (!customer_id || !vendor_id || !service_id || !preference_type) {
      return res.status(400).json({
        success: false,
        message: "customer_id, vendor_id, service_id, and preference_type are required",
      });
    }

    if (!['liked', 'rejected'].includes(preference_type)) {
      return res.status(400).json({
        success: false,
        message: "preference_type must be either 'liked' or 'rejected'",
      });
    }

    const preference = await VendorPreference.findOneAndUpdate(
      { customer_id, vendor_id, service_id },
      { preference_type, updated_at: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Vendor ${preference_type} successfully`,
      data: preference,
    });
  } catch (error) {
    console.error("Error setting vendor preference:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting vendor preference",
      error: error.message,
    });
  }
};

/**
 * Remove vendor preference
 * @route DELETE /api/vendor-preferences
 */
export const removeVendorPreference = async (req, res) => {
  try {
    const { customer_id, vendor_id, service_id } = req.body;

    if (!customer_id || !vendor_id || !service_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id, vendor_id, and service_id are required",
      });
    }

    const result = await VendorPreference.deleteOne({
      customer_id,
      vendor_id,
      service_id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Preference not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preference removed successfully",
    });
  } catch (error) {
    console.error("Error removing vendor preference:", error);
    return res.status(500).json({
      success: false,
      message: "Error removing vendor preference",
      error: error.message,
    });
  }
};

/**
 * Get all vendor preferences for a customer
 * @route GET /api/vendor-preferences?customer_id=xxx&service_id=xxx
 */
export const getVendorPreferences = async (req, res) => {
  try {
    const { customer_id, service_id } = req.query;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id is required",
      });
    }

    const filter = { customer_id };
    if (service_id) {
      filter.service_id = service_id;
    }

    const preferences = await VendorPreference.find(filter);

    return res.status(200).json({
      success: true,
      count: preferences.length,
      data: preferences,
    });
  } catch (error) {
    console.error("Error getting vendor preferences:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting vendor preferences",
      error: error.message,
    });
  }
};

/**
 * Get specific vendor preference
 * @route GET /api/vendor-preferences/check?customer_id=xxx&vendor_id=xxx&service_id=xxx
 */
export const checkVendorPreference = async (req, res) => {
  try {
    const { customer_id, vendor_id, service_id } = req.query;

    if (!customer_id || !vendor_id || !service_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id, vendor_id, and service_id are required",
      });
    }

    const preference = await VendorPreference.findOne({
      customer_id,
      vendor_id,
      service_id,
    });

    return res.status(200).json({
      success: true,
      data: preference || null,
      preference_type: preference?.preference_type || null,
    });
  } catch (error) {
    console.error("Error checking vendor preference:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking vendor preference",
      error: error.message,
    });
  }
};

/**
 * Get liked vendors for a customer
 * @route GET /api/vendor-preferences/liked?customer_id=xxx&service_id=xxx
 */
export const getLikedVendors = async (req, res) => {
  try {
    const { customer_id, service_id } = req.query;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id is required",
      });
    }

    const filter = { customer_id, preference_type: 'liked' };
    if (service_id) {
      filter.service_id = service_id;
    }

    const likedVendors = await VendorPreference.find(filter);

    return res.status(200).json({
      success: true,
      count: likedVendors.length,
      data: likedVendors,
    });
  } catch (error) {
    console.error("Error getting liked vendors:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting liked vendors",
      error: error.message,
    });
  }
};
