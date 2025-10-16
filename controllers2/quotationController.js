import Quotations from "../models2/quotations.js";
import Chat2 from "../models2/chats.js"; // New import
import APIFeatures from "../utils/apiFeatures.js";
import { sendConfirmationMessageToWhatsapp } from "../controllers2/waController.js"; // New import
import CustomerNotification from "../models2/customerNotifications.js";
import vendorNotification from "../models2/vendorNotifications.js";

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

    // Check if a quotation already exists for this service from the same customer
    const existingQuotation = await Quotations.findOne({
      customer_id,
      service_id,
    });
    if (existingQuotation) {
      return res
        .status(400)
        .json({
          message:
            "Quotation already created for this service by this customer.",
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

     // 🧠 Create notification for vendor
    const newNotification = new vendorNotification({
      vendor_id: savedQuotation.vendor_id,
      customer_id: savedQuotation.customer_id,
      service_id: savedQuotation.service_id,
      message: `New quotation request from ${savedQuotation.customer_name}`,
      quotationId: savedQuotation.quotation_id,
      notification_type: 'chat_message',
    })

    await newNotification.save();

    if (io) {
      io.to(`vendor-${savedQuotation.vendor_id}`).emit(
        "newQuotationNotification",
        newNotification.toObject()
      );
    }

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

    const quotations = await Quotations.find({ vendor_id,service_id });

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
      return res
        .status(400)
        .json({ message: "quotation_id and quote_status are required" });
    }

    const updatedQuotation = await Quotations.findOneAndUpdate(
      { quotation_id },
      { $set: { quote_status } },
      { new: true } // Return the updated document
    );

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (updatedQuotation.quote_status === "Accepted") {
      console.log(`This ran ${updatedQuotation.quote_status}`);
      const { customer_id, vendor_id, service_id } = updatedQuotation;
      const existingChat = await Chat2.findOne({
        customer_id,
        vendor_id,
        service_id,
      });

      console.log(`Is chat exist ${existingChat}`);

      if (!existingChat) {
        await Chat2.create({
          chat_id: quotation_id,
          customer_id,
          vendor_id,
          service_id,
          em_id: "admin-rm",
        });
      }
      //Notification for the customer which tells him that the quotation has been accepted by vendor
      const customerNotification = await CustomerNotification.create({
        customer_id,
        quotation_id,
        chat_id: quotation_id,
        notification_type: "chat_message",
        message: "Your quotation has been accepted by the vendor. You can now start a conversation with them in the Quotations tab.",
        read: false,
        updated_at: new Date().toISOString(),
      });

      console.log(customerNotification);

    }

    res.status(200).json({
      message: "Quotation updated successfully!",
      data: updatedQuotation.quote_status,
    });
  } catch (error) {
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

export {
  createQuotation,
  getQuotationsByVendorId,
  getAllQuotations,
  updateQuotationStatus,
  getQuotationById,
  getQuotations,
};
