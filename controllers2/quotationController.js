import Quotations from "../models2/quotations.js";
import Chat2 from "../models2/chats.js"; // New import
import APIFeatures from "../utils/apiFeatures.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers2/waController.js"; // New import
import CustomerNotification from "../models2/customerNotifications.js";
import vendorNotification from "../models2/vendorNotifications.js";
import Message2 from "../models2/message2.js";
import { sendFCMNotificationToVendor } from "../utils/firebaseNotificationUtils.js";

// Create a new quotation
const createQuotation = async (req, res, io) => {
  try {
    const {
      customer_id,
      vendor_id,
      service_id,
      customer_name,
      customer_contact_number,
      event_location,
      event_start,
      event_end,
      guest_count,
      customer_requirements,
      event_type,
      quote_status = "Pending",
      location_type,
    } = req.body;

    const parsedNumberOfGuest = Number(guest_count);

    if (isNaN(parsedNumberOfGuest)) {
      return res
        .status(400)
        .json({ error: "Number of Guests must be a valid number." });
    }

    // ❌ Prevent duplicate quotations from same customer for same service
    const existingQuotation = await Quotations.findOne({
      customer_id,
      service_id,
    });
    if (existingQuotation) {
      return res.status(400).json({
        message: "Quotation already created for this service by this customer.",
      });
    }

    const newQuotation = new Quotations({
      customer_id,
      vendor_id,
      service_id,
      customer_name,
      customer_contact_number,
      event_location,
      event_start: new Date(event_start),
      event_end: new Date(event_end),
      guest_count: parsedNumberOfGuest,
      customer_requirements,
      event_type,
      quote_status,
      location_type,
    });

    // Check for pre-save validation errors (e.g., event_start >= event_end)
    await newQuotation.validate();

    const savedQuotation = await newQuotation.save();

    const existingCustomerAdminChat = await Chat2.findOne({
      chat_id: savedQuotation.quotation_id,
      chat_type: "customer-admin",
    });

    if (!existingCustomerAdminChat) {
      await Chat2.create({
        chat_id: savedQuotation.quotation_id, // Same ID for linkage
        service_id: savedQuotation.service_id,
        customer_id: savedQuotation.customer_id,
        vendor_id: savedQuotation.vendor_id,
        chat_type: "customer-admin",
        chat_status: "ACTIVE",
      });
    }
    else {
      console.log("Customer-admin chat already exists:", savedQuotation.id);
    }

    // 🧠 Create notification for vendor
    const newNotification = new vendorNotification({
      vendor_id: savedQuotation.vendor_id,
      service_id: savedQuotation.service_id,
      chat_id: savedQuotation.quotation_id,
      message: `New quotation request from ${savedQuotation.customer_name}`,
      notification_type: 'chat_message',
    });

    await newNotification.save();

    // ✅ Create Chat immediately between Admin & Customer (Vendor can join later)
    const existingChat = await Chat2.findOne({
      customer_id,
      vendor_id,
      service_id,
    });

    if (!existingChat) {
      await Chat2.create({
        chat_id: savedQuotation.quotation_id, // Same ID for linkage
        customer_id,
        vendor_id,
        service_id,
        em_id: "admin-rm", // or your admin identifier
      });
    }

    if (io) {
      io.to(`vendor-${savedQuotation.vendor_id}`).emit(
        "newQuotationNotification",
        newNotification.toObject()
      );
    }

    //Trigger notification for vendor app
    sendFCMNotificationToVendor({
      vendorId: savedQuotation.vendor_id,
      notification: {
        title: "New Quotation Request",
        body: `New quotation from ${savedQuotation.customer_name}`
      },
      data: {
        type: "quotation",
        quotation_id: savedQuotation.quotation_id,
        customer_name: savedQuotation.customer_name,
        message: `New quotation request from ${savedQuotation.customer_name}`
      }
    }).then(result => {
      console.log(`FCM notifications sent to vendor ${savedQuotation.vendor_id} for quotation ${savedQuotation.quotation_id}`, result);
    }).catch(error => {
      console.error("Failed to send FCM notification for new quotation:", error);
    });


    res.status(201).json({
      message: "Quotation created successfully!",
      data: savedQuotation,
    });

    setImmediate(() => {
      sendConfirmationMessageToWhatsapp({
        customer_mobile: savedQuotation.customer_contact_number,
        customer_name: savedQuotation.customer_name,
        id: savedQuotation.quotation_id,
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
};

// Get quotations by vendor ID
const getQuotationsByVendorId = async (req, res) => {
  try {
    const { vendor_id, service_id } = req.query;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }

    if (!service_id) {
      return res.status(400).json({ message: "service_id is required" });
    }

    const quotations = await Quotations.find({ vendor_id, service_id });

    if (quotations.length === 0) {
      return res
        .status(404)
        .json({ message: `No quotations found for vendor_id: ${vendor_id}` });
    }

    res.status(200).json({
      message: "Quotations retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotations",
      error: error.message,
    });
  }
};

// Get all quotations
const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotations.find();

    if (quotations.length === 0) {
      return res.status(404).json({ message: "No quotations found" });
    }

    res.status(200).json({
      message: "All quotations retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving all quotations",
      error: error.message,
    });
  }
};

// Update quotation status
const updateQuotationStatus = async (req, res) => {
  try {
    const { quotation_id, quote_status } = req.body;
    if (!quotation_id || !quote_status) {
      console.log("⚠️ Missing required fields: quotation_id or quote_status");
      return res
        .status(400)
        .json({ message: "quotation_id and quote_status are required" });
    }

    // Update quotation
    console.log("🔄 Attempting to update quotation status in DB...");
    const updatedQuotation = await Quotations.findOneAndUpdate(
      { quotation_id },
      { $set: { quote_status } },
      { new: true }
    );

    if (!updatedQuotation) {
      console.log("❌ No quotation found for ID:", quotation_id);
      return res.status(404).json({ message: "Quotation not found" });
    }

    console.log("✅ Quotation status updated successfully:", {
      quotation_id,
      new_status: updatedQuotation.quote_status,
    });

    const { customer_id, vendor_id, service_id } = updatedQuotation;
    console.log("ℹ️ Extracted IDs:", { customer_id, vendor_id, service_id });

    // Find or create chat for this vendor-customer-service combo
    console.log("🔍 Checking for existing chat...");
    let existingChat = await Chat2.findOne({
      chat_id: quotation_id,
      chat_type: "vendor-admin",
    });

    if (existingChat) {
      console.log("✅ Existing chat found:", existingChat.chat_id);
    } else if (!existingChat && quote_status === "Accepted") {
      console.log("🆕 No existing chat found. Creating new one...");
      existingChat = await Chat2.create({
        chat_id: quotation_id,
        service_id,
        customer_id,
        vendor_id,
        em_id: "",
        chat_type: "vendor-admin",
        chat_status: "ACTIVE",
      });
      console.log("✅ New chat created:", existingChat.chat_id);
    } else {
      console.log("⚠️ Chat not created — status is not 'Accepted'");
    }

    // --- Prepare system message based on status ---
    let messageContent = "";
    if (quote_status === "Accepted") {
      messageContent = "✅ Vendor accepted the quotation and joined the chat.";
    } else if (quote_status === "Rejected") {
      messageContent = "❌ Vendor rejected the quotation.";
    }

    // --- Insert system message if applicable ---
    if (messageContent && existingChat?.chat_id) {
      console.log("💬 Inserting system message:", messageContent);
      await Message2.create({
        chat_id: existingChat.chat_id,
        sender: "em", // 'em' means system/admin message
        chat_type: existingChat.chat_type,
        sender_id: "system",
        message_type: "system",
        message_content: messageContent,
      });

      // Update timestamps in chat
      if (typeof existingChat.updateLastMessage === "function") {
        console.log("🕓 Updating chat timestamps via instance method...");
        await existingChat.updateLastMessage();
      } else {
        console.log(
          "🕓 Instance method missing — manually updating timestamps..."
        );
        await Chat2.updateOne(
          { chat_id: existingChat.chat_id },
          {
            $set: {
              last_message_updated_at: new Date(),
              chat_updated_at: new Date(),
            },
          }
        );
      }
      console.log("✅ System message and timestamp updates complete.");
    } else {
      console.log(
        "⚠️ No system message inserted (messageContent or chat missing)."
      );
    }

    // --- Create Customer Notification ---
    if (quote_status === "Accepted") {
      console.log("📩 Creating customer notification for Accepted status...");
      await CustomerNotification.create({
        customer_id,
        quotation_id,
        chat_id: existingChat?.chat_id || quotation_id,
        notification_type: "chat_message",
        message:
          "Your quotation has been accepted by the vendor. You can now start chatting in the Quotations tab.",
        read: false,
        updated_at: new Date().toISOString(),
      });
      console.log("✅ Customer notification created (Accepted).");
    } else if (quote_status === "Rejected") {
      console.log("📩 Creating customer notification for Rejected status...");
      await CustomerNotification.create({
        customer_id,
        quotation_id,
        chat_id: existingChat?.chat_id || quotation_id,
        notification_type: "chat_message",
        message:
          "Your quotation has been rejected by the vendor. You can view details in the Quotations tab.",
        read: false,
        updated_at: new Date().toISOString(),
      });
      console.log("✅ Customer notification created (Rejected).");
    } else {
      console.log(
        "ℹ️ No customer notification needed for status:",
        quote_status
      );
    }

    // --- Final Response ---
    console.log("🎯 Quotation update process completed successfully!");
    res.status(200).json({
      message: "Quotation updated successfully!",
      data: updatedQuotation.quote_status,
    });
  } catch (error) {
    console.error("❌ Error updating quotation:", error);
    res.status(500).json({
      message: "Error updating quotation",
      error: error.message,
    });
  }
};

// Get a specific quotation by ID
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotations.findOne({ quotation_id: id });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json({
      message: "Quotation retrieved successfully!",
      quotation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving quotation",
      error: error.message,
    });
  }
};

const getQuotations = async (req, res, next) => {
  try {
    const {
      start_date,
      end_date,
      minCapacity,
      maxCapacity,
      status,
      customer_id,
    } = req.query;

    const filter = {};

    if (minCapacity && maxCapacity) {
      filter.guest_count = {
        $gte: parseInt(minCapacity, 10),
        $lte: parseInt(maxCapacity, 10),
      };
    }

    if (start_date && end_date) {
      filter.event_start = { $gte: new Date(start_date) };
      filter.event_end = { $lte: new Date(end_date) };
    }

    if (status) {
      filter.quote_status = status;
    }

    if (customer_id) {
      filter.customer_id = customer_id;
    }

    const totalDocuments = await Quotations.countDocuments(filter);

    const features = new APIFeatures(Quotations.find(filter), req.query)
      .sort()
      .limitFields()
      .paginate();

    const quotations = await features.query;

    const limitValue = Number(req.query.limit) || 10;
    const totalPages = Math.ceil(totalDocuments / limitValue);

    res.status(200).json({
      status: "success",
      results: quotations.length,
      totalDocuments,
      totalPages,
      currentPage: Number(req.query.page) || 1,
      data: quotations,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const { quotation_id } = req.params;

    const deleteResult = await Quotations.deleteOne({ quotation_id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.status(200).json({
      message: "Quotation deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting quotation",
      error: error.message,
    });
  }
};

export {
  createQuotation,
  getQuotationsByVendorId,
  getAllQuotations,
  updateQuotationStatus,
  getQuotationById,
  getQuotations,
  deleteQuotation,
};
