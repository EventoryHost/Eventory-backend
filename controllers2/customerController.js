import { Caterer } from "../models2/caterer.js";
import { Customer } from "../models2/customer.js";
import PhotographerVideographer from "../models2/photographerVideographer.js";
import { Decorator } from "../models2/decorator.js";
import PropRental from "../models/props.js";
import MakeupArtist from "../models2/makeupArtist.js";
import jwt from "jsonwebtoken";
import VenueProvider from "../models2/venueProvider.js";
import customerNotification from "../models2/customerNotifications.js";
import Quotations from "../models2/quotations.js";

export const addCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.create({
      name,
      phone: "+91" + phone,
      quotations: [],
    });
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    let phone = req.params.mobile;
    if (phone && !phone.startsWith("+91")) {
      phone = "+91" + phone;
    }
    const customer = await Customer.findOne({ contact_number: phone });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ customer });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const { service_id, customer_id } = req.params;

    // Look directly in Quotations collection
    const booking = await Quotations.findOne({
      service_id: service_id,
      customer_id: customer_id,
    });

    if (!booking) {
      return res.status(204).json({ message: "No bookings found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addFavourite = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const service_id = req.params.service_id;

    console.log("customer_id", customer_id);
    const customer = await Customer.findOne({ customer_id: customer_id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!Array.isArray(customer.wishlisted_services)) {
      customer.wishlisted_services = [];
    }
    if (customer.wishlisted_services.includes(service_id)) {
      return res
        .status(400)
        .json({ message: "Service already added to favorites" });
    }

    customer.wishlisted_services.push(service_id);
    console.log("Hellow");
    await customer.save();
    console.log("byeew");

    res.status(200).json({ message: "Added to favorites", customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerNotifications = async (req, res) => {
  const { customer_id } = req.params;

  try {
    if (!customer_id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const notifications = await customerNotification.find({ customer_id });

    return res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  console.log("Receieved from frontend ---> :", notificationId);

  try {
    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const updated = await customerNotification.findByIdAndUpdate(
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
    console.error("❌ Error marking notification as read:", error);
    return res
      .status(500)
      .json({
        message: "Failed to mark notification as read",
        error: error.message,
      });
  }
};

export const getFavoriteServices = async (req, res) => {
  try {
    const customerId = req.params.cusId;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const customer = await Customer.findOne({ id: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const favoriteServiceIds = customer.favoriteServices || [];

    const favoriteVendors = [];

    for (const serviceId of favoriteServiceIds) {
      let collection;

      if (serviceId.startsWith("cat")) {
        collection = Caterer;
      } else if (serviceId.startsWith("veu")) {
        collection = Venue;
      } else if (serviceId.startsWith("pav")) {
        collection = Photographer;
      } else if (serviceId.startsWith("dec")) {
        collection = Decorator;
      } else if (serviceId.startsWith("prop")) {
        collection = PropRental;
      } else if (serviceId.startsWith("mak")) {
        collection = MakeupArtist;
      } else {
        console.warn(`Unknown prefix: ${serviceId}`);
        continue;
      }

      const vendor = await collection.findOne({ id: serviceId });

      if (vendor) {
        favoriteVendors.push(vendor);
      }
    }

    // Total number of favorite vendors
    const total = favoriteVendors.length;

    // If valid page & limit provided, paginate the results
    if (!isNaN(page) && !isNaN(limit)) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVendors = favoriteVendors.slice(startIndex, endIndex);

      return res.status(200).json({
        vendors: paginatedVendors,
        total: total,
      });
    }

    // If no pagination, return full list
    res.status(200).json(favoriteVendors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getFavoriteServiceIds = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    console.log("customer_id", customer_id);
    const customer = await Customer.findOne({ customer_id: customer_id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.wishlisted_services) {
      customer.wishlisted_services = [];
    }
    res.status(200).json(customer.wishlisted_services);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeFavourite = async (req, res) => {
  try {
    const service_id = req.params.service_id;
    const customer_id = req.params.customer_id;
    const customer = await Customer.findOne({ customer_id: customer_id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!customer.wishlisted_services) {
      customer.wishlisted_services = [];
    }
    if (!customer.wishlisted_services.includes(service_id)) {
      return res
        .status(400)
        .json({ message: "Service not found in favourites" });
    }
    customer.wishlisted_services = customer.wishlisted_services.filter(
      (id) => id !== service_id
    );
    await customer.save();
    res.status(200).json(customer);
  } catch {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomerByMobile = async (req, res) => {
  try {
    const mobile = req.params.mobile;
    const customer = await Customer.findOne({ mobile: mobile });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ customer });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  const id = req.params.id;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const mobile = decoded.mobile;

    if (!mobile) return res.status(403).json({ message: "Invalid token" });

    const { mobile: mobileFromBody, ...updates } = req.body;
    if (!mobileFromBody)
      return res.status(400).json({ message: "Phone number missing" });

    const customer = await Customer.findOneAndUpdate(
      { contact_number: mobileFromBody }, // fixed to match schema
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// controller
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({ customer_id: id }).select(
      "-password"
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveBooking = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;

    // Find all quotation IDs recorded for this customer + service
    const customer = await Customer.findOne({ customer_id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const quotations = await Quotations.find({
      customer_id,
      quote_status: { $ne: "Rejected" },
    });

    if (!quotations || quotations.length === 0) {
      return res.status(404).json({ message: "No active bookings found" });
    }

    return res.status(200).json({
      message: "Active bookings retrieved successfully!",
      data: quotations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving active booking",
      error: error.message,
    });
  }
};

// Add this new function to handle the deletion
export const removeQuotationFromCustomer = async (req, res) => {
  try {
    const { customerId, quotationId } = req.params;

    // Use findOneAndUpdate with the $pull operator to remove the object from the array
    const updatedCustomer = await Customer.findOneAndUpdate(
      { id: customerId },
      { $pull: { quotations: { quotationId: quotationId } } },
      { new: true } // Return the updated document
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Check if the quotation was actually removed
    const wasQuotationRemoved = updatedCustomer.quotations.some(
      (q) => q.quotationId === quotationId
    );

    if (wasQuotationRemoved) {
      return res.status(404).json({
        message: "Quotation object not found in customer's document.",
      });
    }

    res.status(200).json({
      message: "Quotation object removed from customer document successfully!",
      customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing quotation object from customer document",
      error: error.message,
    });
  }
};

export const addCustomerInvoice = async (req, res) => {
  const { invoiceUrl, customerId } = req.body;
  console.log(
    `Received request to add invoice for customer ${customerId} with URL ${invoiceUrl}`
  );

  const customer = await Customer.findOne({ customer_id: customerId });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  try {
    customer.invoices.push(invoiceUrl); 
    await customer.save();
    return res.status(200).json({
      message: "Invoice added successfully",
    });
  } catch (error) {
    console.error("Error adding invoice:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
