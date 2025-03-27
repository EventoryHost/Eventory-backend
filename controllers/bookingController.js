import { Booking } from "../models/booking.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import { eventSchema, Venue } from "../models/venue.js";
import Photographer from "../models/photographers.js";
import generateUniqueId from "../utils/generateId.js";

export const createBooking = async (req, res) => {
  const {
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
    paymentStatus,
    capacity,
  } = req.body;

  try {
    const newBooking = new Booking({
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
      paymentStatus,
      capacity,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking: savedBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      message: "An error occurred while creating the booking",
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
  const { bookingId } = req.params; // Retrieve the booking ID from the URL parameters
  const updateData = req.body; // Expecting the updated data from the request body

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
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
    const { title, start, end, calendarId, type } = req.body;
    const { serId } = req.query; // Extract vendor ID from query parameters

    if (!serId || !title || !start || !end || !type) {
      console.log("hit", req.body);
      return res.status(400).json({ message: "Missing required fields: serId, title, start, end, type" });
    }

    let vendorModel;

    switch (type) {
      case "venue":
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
      start: new Date(start), // Convert to Date object
      end: new Date(end),
    };

    console.log(event);
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

export const deleteOfflineEvent = async (req, res) => {
  try {
    const { serId, calendarId, type } = req.query; // Extract parameters

    if (!serId || !calendarId || !type) {
      return res.status(400).json({ message: "Missing required fields: serId, calendarId, type" });
    }

    let vendorModel;

    switch (type) {
      case "venue":
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
      default:
        return res.status(400).json({ message: "Invalid vendor type" });
    }

    // Find the vendor by its ID
    const vendor = await vendorModel.findOne({ id: serId });

    if (!vendor) {
      return res.status(404).json({ message: `${type} not found` });
    }

    // Find the event index using calendarId
    const eventIndex = vendor.schedule.findIndex(event => event.calendarId === calendarId);

    if (eventIndex === -1) {
      return res.status(404).json({ message: "Event not found in schedule" });
    }

    // Remove the event from the schedule
    vendor.schedule.splice(eventIndex, 1);

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
    const { year, month, vendorId, type } = req.query;

    // if (!year || !month) {
    //   return res.status(400).json({ error: "Year and month are required." });
    // }

    // const startOfMonth = new Date(year, month - 1, 1);
    // const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    let vendorModel;

    switch (type) {
      case "venue":
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
      default:
        return res.status(400).json({ error: "Invalid vendor type." });
    }

    const vendor = await vendorModel.findOne({ venId: vendorId }, "schedule");
    // console.log(startOfMonth, endOfMonth);
    const offlineBookings =
      vendor?.schedule.filter((booking) => {
        const bookingDate = new Date(booking.startDate);
        return bookingDate;
        // return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
      }) || [];

    const onlineBookings = await Booking.find({
      venId: vendorId,
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
