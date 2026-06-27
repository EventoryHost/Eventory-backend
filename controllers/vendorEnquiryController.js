import VendorEnquiry from "../models/vendorEnquiry.js";
import Chat from "../models/chats.js";
import VendorNotifications from "../models/vendorNotifications.js";
import generateUniqueId from "../utils/generateId.js";

/**
 * Create a new vendor enquiry and establish chat
 * @route POST /api/emadmin/vendor-enquiries
 */
export const createVendorEnquiry = async (req, res) => {
  try {
    const {
      vendor_id,
      vendor_name,
      vendor_email,
      vendor_mobile,
      vendor_type,
      service_id,
      em_id,
      em_name,
    } = req.body;

    if (
      !vendor_id ||
      !vendor_name ||
      !vendor_email ||
      !vendor_type ||
      !em_id ||
      !em_name
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "vendor_id",
          "vendor_name",
          "vendor_email",
          "vendor_type",
          "service_id",
          "em_id",
          "em_name",
        ],
      });
    }

    const chat = await Chat.create({
      chat_id: generateUniqueId("CHAT"),
      chat_type: "vendor-enquiry",
      em_id,
      vendor_id,
      service_id: service_id || null,
      customer_id: "N/A",
      chat_status: "ACTIVE",
    });

    const vendorEnquiry = await VendorEnquiry.create({
      vendor_id,
      vendor_name,
      vendor_email,
      vendor_mobile,
      vendor_type,
      service_id: service_id || null,
      em_id,
      em_name,
      chat_id: chat.chat_id,
      enquiry_status: "active",
    });

    await VendorNotifications.create({
      service_id: service_id || null,
      vendor_id,
      chat_id: chat.chat_id,
      notification_type: "chat_message",
      message: `New enquiry from admin. Please check your messages.`,
      read: false,
    });

    return res.status(201).json({
      success: true,
      message: "Vendor enquiry created successfully",
      data: {
        enquiry_id: vendorEnquiry.enquiry_id,
        chat_id: vendorEnquiry.chat_id,
        vendor_id: vendorEnquiry.vendor_id,
        vendor_name: vendorEnquiry.vendor_name,
        vendor_type: vendorEnquiry.vendor_type,
        enquiry_status: vendorEnquiry.enquiry_status,
        created_at: vendorEnquiry.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating vendor enquiry:", error);
    return res.status(500).json({
      error: "An error occurred while creating enquiry",
      message: error.message,
    });
  }
};

/**
 * Get all vendor enquiries with pagination and filters
 * @route GET /api/emadmin/vendor-enquiries
 * @query page - Page number (default: 1)
 * @query limit - Records per page (default: 10)
 * @query status - Filter by status (active, resolved, closed)
 * @query em_id - Filter by admin ID
 * @query vendor_id - Filter by vendor ID
 */
export const getAllVendorEnquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = null,
      em_id = null,
      vendor_id = null,
      search = null,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.enquiry_status = status;
    if (em_id) query.em_id = em_id;
    if (vendor_id) query.vendor_id = vendor_id;

    if (search) {
      query.$or = [
        { enquiry_id: { $regex: search, $options: "i" } },
        { vendor_name: { $regex: search, $options: "i" } },
        { service_id: { $regex: search, $options: "i" } },
        { vendor_id: { $regex: search, $options: "i" } },
      ];
    }

    const total = await VendorEnquiry.countDocuments(query);

    const enquiries = await VendorEnquiry.find(query)
      .sort({ last_message_time: -1, created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor enquiries:", error);
    return res.status(500).json({
      error: "An error occurred while fetching enquiries",
      message: error.message,
    });
  }
};

/**
 * Get single vendor enquiry
 * @route GET /api/emadmin/vendor-enquiries/:enquiry_id
 */
export const getVendorEnquiry = async (req, res) => {
  try {
    const { enquiry_id } = req.params;

    const enquiry = await VendorEnquiry.findOne({ enquiry_id }).lean();

    if (!enquiry) {
      return res.status(404).json({
        error: "Vendor enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error("Error fetching vendor enquiry:", error);
    return res.status(500).json({
      error: "An error occurred while fetching enquiry",
      message: error.message,
    });
  }
};

/**
 * Update vendor enquiry (status, notes)
 * @route PATCH /api/emadmin/vendor-enquiries/:enquiry_id
 */
export const updateVendorEnquiry = async (req, res) => {
  try {
    const { enquiry_id } = req.params;
    const { enquiry_status, notes } = req.body;

    if (
      enquiry_status &&
      !["active", "resolved", "closed"].includes(enquiry_status)
    ) {
      return res.status(400).json({
        error: "Invalid enquiry status",
        validStatuses: ["active", "resolved", "closed"],
      });
    }

    const updateData = {};
    if (enquiry_status) {
      updateData.enquiry_status = enquiry_status;
      if (enquiry_status === "resolved") {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        updateData.resolved_at = new Date(now.getTime() + istOffset);
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const enquiry = await VendorEnquiry.findOneAndUpdate(
      { enquiry_id },
      updateData,
      { new: true, runValidators: true },
    ).lean();

    if (!enquiry) {
      return res.status(404).json({
        error: "Vendor enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("Error updating vendor enquiry:", error);
    return res.status(500).json({
      error: "An error occurred while updating enquiry",
      message: error.message,
    });
  }
};

/**
 * Delete vendor enquiry
 * @route DELETE /api/emadmin/vendor-enquiries/:enquiry_id
 */
export const deleteVendorEnquiry = async (req, res) => {
  try {
    const { enquiry_id } = req.params;

    const enquiry = await VendorEnquiry.findOneAndDelete({ enquiry_id }).lean();

    if (!enquiry) {
      return res.status(404).json({
        error: "Vendor enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor enquiry deleted successfully",
      data: {
        enquiry_id: enquiry.enquiry_id,
      },
    });
  } catch (error) {
    console.error("Error deleting vendor enquiry:", error);
    return res.status(500).json({
      error: "An error occurred while deleting enquiry",
      message: error.message,
    });
  }
};

/**
 * Update enquiry with latest message (called from chat controller)
 * @internal Used by chatController when message is sent in vendor-enquiry chat
 */
export const updateEnquiryWithMessage = async (
  chat_id,
  last_message,
  last_message_by,
) => {
  try {
    await VendorEnquiry.findOneAndUpdate(
      { chat_id },
      {
        last_message,
        last_message_time: new Date(),
        last_message_by,
      },
    );
  } catch (error) {
    console.error("Error updating enquiry with message:", error);
  }
};
