import { Booking } from "../models/booking.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import { Venue } from "../models/venue.js";
import Photographer from "../models/photographers.js";
import MakeupArtist from "../models/makeupArtists.js";

import generateUniqueId from "../utils/generateId.js";
import { sendVendorEventBookingMessage } from "./waController.js";
import { sendCustomerEventBookingMessage } from "./waController.js";
import { Vendor } from "../models/users.js";
import { Customer } from "../models/customer.js";
import adminNotification from "../models/adminNotification.js";
import customerNotification from "../models/customerNotification.js";
import vendorNotification from "../models/vendorNotification.js";
import DjArtist from "../models/djArtist.js";

const prefixToModelMap = {
  cat: { Model: Caterer, vendorType: "caterer" },
  dec: { Model: Decorator, vendorType: "decorator" },
  mak: { Model: MakeupArtist, vendorType: "makeup" },
  pav: { Model: Photographer, vendorType: "photographer" },
  veu: { Model: Venue, vendorType: "venue" },
  dj: { Model: DjArtist, vendorType: "dj" },
  // future vendors can be added here (e.g., mc: { Model: MCAnchor, vendorType: "mc" })
};

function modelFromServiceId(serviceId) {
  if (!serviceId || typeof serviceId !== "string") return null;

  const lowerId = serviceId.toLowerCase();

  // find the first matching prefix dynamically
  for (const prefix of Object.keys(prefixToModelMap)) {
    if (lowerId.startsWith(prefix)) {
      return prefixToModelMap[prefix];
    }
  }

  return null; // no matching vendor
}


function getStatusColor(paymentDetails) {
  if (!paymentDetails) return "yellow";
  if (typeof paymentDetails === "string") {
    try { paymentDetails = JSON.parse(paymentDetails); }
    catch { return "yellow"; }
  }
  if (paymentDetails.fullPaid !== undefined && paymentDetails.fullPaid !== null) {
    return "green";
  }
  return "yellow";
}

export const createBooking = async (req, res) => {
  const {
    bookingid,
    customerId,
    venId,
    serviceId,
    type,
    location,
    startDate,
    endDate,
    details,
    guest,
    amount,
    managerName,
    customerName,
    description,
    paymentDetails,
    status,
    paymentStatus,
    capacity,
    vendorBusinessDetails,
    rating,
    finalizedContents,
    serviceName,
    serviceLocation,
    eventLocation,
    eventTime,
    eventType,
  } = req.body;

  const eventId = generateUniqueId("eve");

  try {
    let savedBooking;
    if (bookingid) {
      savedBooking = await Booking.findOneAndUpdate(
        { bookingid },
        {
          $set: {
            customerId,
            venId,
            serviceId,
            type,
            location,
            startDate,
            endDate,
            details,
            guest,
            amount,
            managerName,
            customerName,
            description,
            paymentDetails,
            status,
            paymentStatus,
            capacity,
            vendorBusinessDetails,
            rating,
            finalizedContents,
            serviceName,
            serviceLocation,
            eventLocation,
            eventTime,
            eventType,
            eventId,
          },
        },
        { new: true }
      );
      if (!savedBooking) {
        savedBooking = new Booking({
          bookingid,
          customerId,
          venId,
          serviceId,
          type,
          location,
          startDate,
          endDate,
          details,
          guest,
          amount,
          managerName,
          customerName,
          description,
          paymentDetails,
          status,
          paymentStatus,
          capacity,
          vendorBusinessDetails,
          rating,
          finalizedContents,
          serviceName,
          serviceLocation,
          eventLocation,
          eventTime,
          eventType,
          eventId,
        });
        await savedBooking.save();
      }
    } else {
      savedBooking = new Booking({
        bookingid: generateUniqueId("book"),
        customerId,
        venId,
        serviceId,
        type,
        location,
        startDate,
        endDate,
        details,
        guest,
        amount,
        managerName,
        customerName,
        description,
        paymentDetails,
        status,
        paymentStatus,
        capacity,
        vendorBusinessDetails,
        rating,
        finalizedContents,
        serviceName,
        serviceLocation,
        eventLocation,
        eventTime,
        eventType,
        eventId,
      });
      await savedBooking.save();
    }

    const color = getStatusColor(paymentDetails);

    try {
      const resolved = modelFromServiceId(serviceId);
      if (resolved) {
        const { Model } = resolved;
        const eventObj = {
          id: eventId,
          title: eventType,
          description:
            (description && description.trim()) ||
            `Booking ${savedBooking.bookingid} - ${customerName || ""}`.trim(),
          start: startDate,
          end: endDate,
          color,
        };
        await Model.findOneAndUpdate(
          { id: serviceId },
          { $push: { schedule: eventObj } },
          { new: true }
        ).lean();
      }
    } catch {
      // ignore errors here, but log if desired
    }

    res.status(201).json({
      message: "Booking saved successfully",
      booking: savedBooking,
    });

    const vendor = await Vendor.findOne({ id: venId }).lean();
    const customer = await Customer.findOne({ id: customerId }).lean();

    const adminMessage = `New booking ${savedBooking.bookingid} created by ${customer?.name} for ${vendor?.businessDetails?.businessName || vendor?.name}.`;
    const vendorMessage = `You have a new booking ${savedBooking.bookingid} from ${customer?.name}.`;
    const customerMessage = `Your booking ${savedBooking.bookingid} for ${vendor?.businessDetails?.businessName || vendor?.name} has been confirmed.`;

    try {
      await adminNotification.create({
        orderId: savedBooking.bookingid,
        vendorId: venId,
        customerId,
        message: adminMessage,
        quotationId: "",
        read: false,
        timestamp: new Date(),
      });

      await vendorNotification.create({
        orderId: savedBooking.bookingid,
        vendorId: venId,
        customerId,
        message: vendorMessage,
        type: "booking_confirmed",
        read: false,
        timestamp: new Date(),
      });

      await customerNotification.create({
        orderId: savedBooking.bookingid,
        vendorId: venId,
        customerId,
        message: customerMessage,
        read: false,
        createdAt: new Date(),
      });
    } catch (notifError) {
      console.error("Notification creation failed:", notifError);
    }
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      message: "An error occurred while saving the booking",
      error: error.message,
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const { serId, venId } = req.query;
    console.log("Received service ID:", serId);
    console.log("Received vendor ID:", venId);

    if (!serId) {
      return res.status(400).json({ message: "Please provide service ID" });
    }
    if (!venId) {
      return res.status(400).json({ message: "Please provide vendor ID" });
    }

    const booking = await Booking.find({ venId: venId, serviceId: serId });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchBooking = async (req, res) => {
  try {
    const { serId } = req.query;

    if (!serId) {
      return res.status(400).json({ message: "Please provide service ID" });
    }

    const booking = await Booking.find({ serviceId: serId });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const updateData = req.body;

  try {
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingid: bookingId },
      { $set: updateData },
      { new: true }
    );


    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }


    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { bookingId } = req.params; // Retrieve the booking ID from the URL parameters

  try {
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving bookings", error: error.message });
  }
};

export const addOfflineEvent = async (req, res) => {
  try {
    const { title, start, end, calendarId, type, description, color } =
      req.body;
    const { serId } = req.query; // Extract vendor ID from query parameters

    if (!serId || !title || !start || !end || !type || !color) {
      console.log("hit", req.body);
      return res.status(400).json({
        message:
          "Missing required fields: serId, title, start, end, type, color",
      });
    }

    const colorOptions = {
      "#94CCC1": "teal",
      "#D59D53": "orange",
      "#6D65C3": "indigo",
      "#509BF0": "blue",
      "#F050E3": "purple",
    };

    let vendorModel;

    switch (type) {
      case "venue-provider":
        vendorModel = Venue;
        break;
      case "caterer":
        vendorModel = Caterer;
        break;
      case "decorator":
        vendorModel = Decorator;
        break;
      case "pav":
        vendorModel = Photographer;
        break;
      case "makeup-artist":
        vendorModel = MakeupArtist;
        break;
      case "dj-vendor":
        vendorModel = DjArtist;
        break;
      default:
        return res.status(400).json({ message: "Invalid vendor type" });
    }

    // Find the vendor by its ID field
    const vendor = await vendorModel.findOne({ id: serId });

    if (!vendor) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Create an event object
    const event = {
      calendarId: generateUniqueId("cal"), // Example: "upcoming"
      id: vendor.schedule.length + 1, // Generate a unique ID (consider using a better approach)
      title,
      description,
      start: new Date(start), // Convert to Date object
      end: new Date(end),
      color: colorOptions[color], // Use the color mapping or fallback to the provided color
    };

    // console.log(event);
    // Validate the event object against the eventSchema

    // Push the new event to the schedule array
    vendor.schedule.push(event);

    // Save the updated vendor document
    await vendor.save();

    return res.status(200).json({ message: "Event added successfully", event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editOfflineEvent = async (req, res) => {
  try {
    const { serId, type, calendarId, updatedEventData } = req.body.data;

    console.log("Received Data:", req.body.data);

    if (!serId || !calendarId || !type || !updatedEventData) {
      return res.status(400).json({
        message:
          "Missing required fields: serId, calendarId, type, or updatedEventData",
      });
    }

    let vendorModel;

    switch (type.toLowerCase()) {
      case "venue-provider":
        vendorModel = Venue;
        break;
      case "caterer":
        vendorModel = Caterer;
        break;
      case "decorator":
        vendorModel = Decorator;
        break;
      case "photographer":
        vendorModel = Photographer;
        break;
      case "makeup-artist":
        vendorModel = MakeupArtist;
        break;
      case "dj-vendor":
        vendorModel = DjArtist;
        break;
      default:
        return res.status(400).json({ message: "Invalid vendor type" });
    }

    const vendor = await vendorModel.findOne({ id: serId });

    if (!vendor) {
      return res.status(404).json({ message: `${type} not found` });
    }

    if (!Array.isArray(vendor.schedule)) {
      vendor.schedule = [];
    }

    const index = vendor.schedule.findIndex(
      (event) => event.calendarId === updatedEventData.calendarId,
    );

    if (index === -1) {
      return res.status(404).json({ message: "Event not found in schedule" });
    }

    // Update only the fields that are provided in updatedEventData
    vendor.schedule[index] = {
      ...vendor.schedule[index],
      ...updatedEventData,
    };

    await vendor.save();

    return res.status(200).json({
      message: "Event updated successfully",
      updatedEvent: vendor.schedule[index],
    });
  } catch (error) {
    console.error("Error in editOfflineEvent:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteOfflineEvent = async (req, res) => {
  try {
    const { serId, type } = req.body.data; // Extract parameters
    const calendarId = req.body.data.calenderId; // Extract calendarId from query parameters
    console.log("Received Data:", req.body.data);

    if (!serId || !calendarId || !type) {
      return res
        .status(400)
        .json({ message: "Missing required fields: serId, calendarId, type" });
    }

    let vendorModel;

    switch (type) {
      case "venue-provider":
        vendorModel = Venue;
        break;
      case "caterer":
        vendorModel = Caterer;
        break;
      case "decorator":
        vendorModel = Decorator;
        break;
      case "photographer":
        vendorModel = Photographer;
        break;
      case "makeup-artist":
        vendorModel = MakeupArtist;
        break;
        case "dj-vendor":
        vendorModel = DjArtist;
        break;
      default:
        return res.status(400).json({ message: "Invalid vendor type" });
    }

    // Find the vendor by its ID
    const vendor = await vendorModel.findOne({ id: serId });

    if (!vendor) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Filter out the event that matches the given calendarId
    const updatedSchedule = vendor.schedule.filter(
      (event) => event.calendarId !== calendarId,
    );

    // If no change in schedule, it means the event was not found
    if (updatedSchedule.length === vendor.schedule.length) {
      return res.status(404).json({ message: "Event not found in schedule" });
    }

    // Update the vendor's schedule
    vendor.schedule = updatedSchedule;

    // Save the updated vendor document
    await vendor.save();

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVendorBookings = async (req, res) => {
  try {
    const { year, month, serId, type } = req.query;

    // if (!year || !month) {
    //   return res.status(400).json({ error: "Year and month are required." });
    // }

    // const startOfMonth = new Date(year, month - 1, 1);
    // const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    let vendorModel;

    switch (type) {
      case "venue-provider":
        vendorModel = Venue;
        break;
      case "caterer":
        vendorModel = Caterer;
        break;
      case "decorator":
        vendorModel = Decorator;
        break;
      case "photographer":
        vendorModel = Photographer;
        break;
      case "makeup-artist":
        vendorModel = MakeupArtist;
        break;
      case "dj-vendor":
        vendorModel = DjArtist;
        break;
      default:
        return res.status(400).json({ error: "Invalid vendor type." });
    }

    const vendor = await vendorModel.findOne({ id: serId }, "schedule");
    // console.log(startOfMonth, endOfMonth);
    const offlineBookings =
      vendor?.schedule.filter((booking) => {
        const bookingDate = new Date(booking.startDate);
        return bookingDate;
        // return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
      }) || [];

    const onlineBookings = await Booking.find({
      serviceId: serId,
      // startDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json({
      offlineBookings,
      onlineBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findOne({ bookingid: bookingId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBookingsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const bookings = await Booking.find({ customerId });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings by customerId:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const getAllVendorServiceSchedules = async (req, res) => {
  const { vendorId, services } = req.body;

  if (!vendorId || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ message: "vendorId and services array are required" });
  }

  try {
    const groupedByType = {};

    for (const service of services) {
      const { type, id: serviceId } = service;
      const serviceType = type.toLowerCase();

      let vendorModel;

      switch (serviceType) {
        case "venue-provider":
          vendorModel = Venue;
          break;
        case "caterer":
          vendorModel = Caterer;
          break;
        case "decorator":
          vendorModel = Decorator;
          break;
        case "photographer":
        case "pav":
          vendorModel = Photographer;
          break;
        case "makeup-artist":
        case "makeupartist":
          vendorModel = MakeupArtist;
          break;
        case "dj-vendor":
          vendorModel = DjArtist;
          break;
        default:
          continue;
      }

      const vendorDoc = await vendorModel.findOne({ id: serviceId }, "schedule");
      const onlineBookings = await Booking.find({ venId: vendorId, serviceId });

      if (!groupedByType[serviceType]) {
        groupedByType[serviceType] = {
          type: serviceType,
          offlineBookings: [],
          onlineBookings: [],
        };
      }

      // Append offline & online bookings for this type
      groupedByType[serviceType].offlineBookings.push(...(vendorDoc?.schedule || []));
      groupedByType[serviceType].onlineBookings.push(...onlineBookings);
    }

    return res.status(200).json({ services: Object.values(groupedByType) });
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const addBookingInvoice = async (req, res) => {
  try {
    const { bookingId, customerInvoiceUrl, vendorInvoiceUrl } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    if (!customerInvoiceUrl && !vendorInvoiceUrl) {
      return res.status(400).json({ error: 'At least one invoice URL is required' });
    }

    const update = {};
    if (customerInvoiceUrl) update['$push'] = { 'invoices.customerInvoices': customerInvoiceUrl };
    if (vendorInvoiceUrl) {
      if (!update['$push']) update['$push'] = {};
      update['$push']['invoices.vendorInvoices'] = vendorInvoiceUrl;
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingid: bookingId },
      update,
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: `Booking with id ${bookingId} not found` });
    }

    res.status(200).json({
      message: 'Invoice URLs added successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error adding invoice URLs to booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};