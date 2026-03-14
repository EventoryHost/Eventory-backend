import { Invoices } from "../models/invoices.js";
import { Customer } from "../models/customer.js";
import { Vendor } from "../models/vendor.js";
import { Events } from "../models/events.js";

// Create a new invoice
export const createInvoice = async (req, res) => {
  try {
    const { invoice_url, type, invoice_for, payment_label, vendor_id, service_id, customer_id, event_id } =
      req.body;

    // Validate required fields
    if (!invoice_url || !type || !vendor_id || !service_id) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: invoice_url, type, vendor_id, service_id",
      });
    }

    // Validate type enum
    const validTypes = [
      "registration",
      "advance_booking",
      "booking",
      "payment",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid type. Must be one of: registration, advance_booking, booking, payment",
      });
    }

    // Validate invoice_for
    if (invoice_for && !['customer', 'vendor'].includes(invoice_for)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice_for. Must be 'customer' or 'vendor'",
      });
    }

    // Validate customer_id based on type
    if (type === "registration" && customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID should be null for registration type invoices",
      });
    }

    if (type !== "registration" && !customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required for non-registration invoices",
      });
    }

    // Validate event_id based on type
    if (type === "registration" && event_id) {
      return res.status(400).json({
        success: false,
        message: "Event ID should be null for registration type invoices",
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findOne({ vendor_id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Check if customer exists (for non-registration invoices)
    if (customer_id) {
      const customer = await Customer.findOne({ customer_id });
      console.log(customer);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    // Check if event exists (if event_id is provided)
    if (event_id) {
      const event = await Events.findOne({ event_id });
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }
    }

    // Create the invoice
    const invoice = new Invoices({
      invoice_url,
      type,
      invoice_for: invoice_for || (type === "registration" ? "vendor" : "customer"),
      payment_label: payment_label || null,
      vendor_id,
      service_id,
      customer_id: type === "registration" ? null : customer_id,
      event_id: type === "registration" ? null : event_id,
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all invoices with pagination and filtering
export const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      vendor_id,
      customer_id,
      service_id,
      event_id,
      start_date,
      end_date,
    } = req.query;

    // Build filter object
    const filter = {};

    if (type) filter.type = type;
    if (vendor_id) filter.vendor_id = vendor_id;
    if (customer_id) filter.customer_id = customer_id;
    if (service_id) filter.service_id = service_id;
    if (event_id) filter.event_id = event_id;

    // Date range filter
    if (start_date || end_date) {
      filter.invoice_created_at = {};
      if (start_date) filter.invoice_created_at.$gte = new Date(start_date);
      if (end_date) filter.invoice_created_at.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoices.find(filter)
      .sort({ invoice_created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("vendor_id", "business_name contact_number email")
      .populate("customer_id", "name contact_number email")
      .populate("event_id", "event_name event_date venue");

    const total = await Invoices.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoices.findOne({ invoice_id: id })
      .populate("vendor_id", "business_name contact_number email")
      .populate("customer_id", "name contact_number email")
      .populate("event_id", "event_name event_date venue");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice by invoice number
export const getInvoiceByNumber = async (req, res) => {
  try {
    const { invoice_no } = req.params;

    const invoice = await Invoices.findOne({ invoice_no: parseInt(invoice_no) })
      .populate("vendor_id", "business_name contact_number email")
      .populate("customer_id", "name contact_number email")
      .populate("event_id", "event_name event_date venue");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoices by vendor ID
export const getInvoicesByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const filter = { vendor_id };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoices.find(filter)
      .sort({ invoice_created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customer_id", "name contact_number email")
      .populate("event_id", "event_name event_date venue");

    const total = await Invoices.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendor invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoices by customer ID
export const getInvoicesByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const filter = { customer_id };
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoices.find(filter)
      .sort({ invoice_created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("vendor_id", "business_name contact_number email")
      .populate("event_id", "event_name event_date venue");

    const total = await Invoices.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoices by event ID
export const getInvoicesByEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoices.find({ event_id })
      .sort({ invoice_created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("vendor_id", "business_name contact_number email")
      .populate("customer_id", "name contact_number email");

    const total = await Invoices.countDocuments({ event_id });

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching event invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.invoice_no;
    delete updateData.invoice_id;
    delete updateData.invoice_created_at;

    // const invoice = await Invoices.findByIdAndUpdate(
    //   id,
    //   updateData,
    //   { new: true, runValidators: true }
    // );

    const invoice = await Invoices.findOneAndUpdate(
      { invoice_id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoices.findOneAndDelete({ invoice_id: id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const { vendor_id, customer_id, start_date, end_date } = req.query;

    const filter = {};
    if (vendor_id) filter.vendor_id = vendor_id;
    if (customer_id) filter.customer_id = customer_id;
    if (start_date || end_date) {
      filter.invoice_created_at = {};
      if (start_date) filter.invoice_created_at.$gte = new Date(start_date);
      if (end_date) filter.invoice_created_at.$lte = new Date(end_date);
    }

    const stats = await Invoices.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_invoices: { $sum: 1 },
          registration_invoices: {
            $sum: { $cond: [{ $eq: ["$type", "registration"] }, 1, 0] },
          },
          advance_booking_invoices: {
            $sum: { $cond: [{ $eq: ["$type", "advance_booking"] }, 1, 0] },
          },
          booking_invoices: {
            $sum: { $cond: [{ $eq: ["$type", "booking"] }, 1, 0] },
          },
          payment_invoices: {
            $sum: { $cond: [{ $eq: ["$type", "payment"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total_invoices: 0,
      registration_invoices: 0,
      advance_booking_invoices: 0,
      booking_invoices: 0,
      payment_invoices: 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching invoice statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get recent invoices
export const getRecentInvoices = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const invoices = await Invoices.find()
      .sort({ invoice_created_at: -1 })
      .limit(parseInt(limit))
      .populate("vendor_id", "business_name")
      .populate("customer_id", "name")
      .populate("event_id", "event_name");

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching recent invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
