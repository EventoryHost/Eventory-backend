import { Caterer } from "../models/caterer.js";
import { Customer } from "../models/customer.js";
import Photographer from "../models/photographers.js";
import { Decorator } from "../models/decoraters.js";
import PropRental from "../models/props.js";
import MakeupArtist from "../models/makeupArtists.js";
import jwt from "jsonwebtoken";
import { Venue } from "../models/venue.js";
import  customerNotification  from "../models/customerNotification.js";

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
    let phone  = req.params.mobile;
    if (phone && !phone.startsWith("+91")) {
      phone = "+91" + phone;
    }
    const customer = await Customer.findOne({ mobile: phone });
    if(!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({customer});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const serviceId = req.params.serId;
    const customerId = req.params.cusId;
    const booking = await Customer.findOne({
      id: customerId,
      quotations: { $elemMatch: { serviceId: serviceId } },
    });
    if (!booking) {
      return res.status(204).json({ message: "No bookings found" });
    }
    res.status(200).json(booking);
  } catch {
    res.status(400).json({ message: error.message });
  }
};

export const addFavourite = async (req, res) => {
  try {
    const customerId = req.params.cusId;
    const serviceId = req.params.serviceId; 

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!Array.isArray(customer.favoriteServices)) {
      customer.favoriteServices = [];
    }
    if (customer.favoriteServices.includes(serviceId)) {
      return res.status(400).json({ message: "Service already added to favorites" });
    }

    customer.favoriteServices.push(serviceId);
    await customer.save();

    res.status(200).json({ message: "Added to favorites", customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerNotifications = async (req, res) => {
  const { customerId } = req.params;

  try {
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const notifications = await customerNotification.find({ customerId });

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
      .json({ message: "Failed to mark notification as read", error: error.message });
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
    const customerId = req.params.cusId;
    const customer = await Customer.findOne({ id: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.favoriteServices) {
      customer.favoriteServices = [];
    }
    res.status(200).json(customer.favoriteServices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeFavourite = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const customerId = req.params.cusId;
    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (!customer.favoriteServices) {
      customer.favoriteServices = [];
    }
    if (!customer.favoriteServices.includes(serviceId)) {
      return res
        .status(400)
        .json({ message: "Service not found in favourites" });
    }
    customer.favoriteServices = customer.favoriteServices.filter(
      (id) => id !== serviceId,
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
    if (!mobileFromBody) return res.status(400).json({ message: "Phone number missing" });

    const customer = await Customer.findOneAndUpdate(
      { mobile: mobileFromBody },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// controller
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({ id: id }).select("-password");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

