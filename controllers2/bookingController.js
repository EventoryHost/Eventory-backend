import { Events } from "../models2/events.js";
import { Caterer } from "../models2/caterer.js";
import { Decorator } from "../models2/decorator.js";
import VenueProvider  from "../models2/venueProvider.js";
import Photographer from "../models2/photographerVideographer.js";
import MakeupArtist from "../models2/makeupArtist.js";
import generateUniqueId from "../utils/generateId.js";
import { Calendar } from "../models2/calendar.js";

export const createBooking = async (req, res) => {
   try {
    // Take everything directly from req.body
    const { paymentDetails, payment_method_details, quotation_id, ...eventData } = req.body;

    // Handle paymentDetails and payment_method_details separately to ensure proper schema validation
    const eventFields = { ...eventData };
    if (paymentDetails) {
      eventFields.paymentDetails = paymentDetails;
    }
    if (payment_method_details) {
      eventFields.payment_method_details = payment_method_details;
    }
    if (quotation_id) {
      eventFields.quotation_id = quotation_id;
    }

    const newEvent = new Events(eventFields);

    const savedEvent = await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "An error occurred while creating the event",
      error: error.message,
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const { service_id, vendor_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "Please provide service ID" });
    }
    if (!vendor_id) {
      return res.status(400).json({ message: "Please provide vendor ID" });
    }

    const booking = await Events.find({ vendor_id, service_id });

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
    const { service_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "Please provide service ID" });
    }

    const booking = await Events.find({ service_id });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  const { event_id } = req.params; // Retrieve the booking ID from the URL parameters
  const updateData = req.body; // Expecting the updated data from the request body

  try {
    const updatedBooking = await Events.findOneAndUpdate(
    { event_id: event_id }, // filter object
    updateData,
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
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  const { event_id } = req.params; // Retrieve event_id from URL parameters

  try {
    const deletedBooking = await Events.findOneAndDelete({ event_id });

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Events.find();
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving bookings", error: error.message });
  }
};

export const addOfflineEvent = async (req, res) => {
  //type -> service_type
  try {
    const { event_start, event_end, type, event_description, event_highlight, quotation_id } = req.body;
    const { service_id } = req.query;

    if (!service_id || !event_start || !event_end || !type || !event_highlight || !event_description) {
      return res.status(400).json({
        message: "Missing required fields: serId, title, start, end, type, color",
      });
    }

    // Expect start/end to be ISO UTC strings (from frontend fix). Coerce and validate.
    const startDate = new Date(event_start);   // e.g., 2025-10-15T04:30:00.000Z
    const endDate = new Date(event_end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid start or end datetime" });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ message: "end must be after start" });
    }

    const colorOptions = {
      "#94CCC1": "teal",
      "#D59D53": "orange",
      "#6D65C3": "indigo",
      "#509BF0": "blue",
      "#F050E3": "purple",
    };

    const calendar = new Calendar({
      service_id: service_id,
      event_start: startDate,
      event_end: endDate,
      event_description: event_description,
      event_highlight: event_highlight,
      event_source: 'EXTERNAL',
      event_type: 'booked'
    });

    await calendar.save();

    return res.status(200).json({ message: "Event added successfully", calendar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editOfflineEvent = async (req, res) => {
  try {
    const { event_id, updatedEventData } = req.body;


    // Validation
    if ( !event_id || !updatedEventData) {
      return res.status(400).json({
        message: "Missing required fields: service_id, event_id, or updatedEventData",
      });
    }

    // Find the calendar entry by event_id
    const calendar = await Calendar.findOne({ event_id });
    if (!calendar) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update allowed fields
    Object.assign(calendar, updatedEventData);

    // Save the updated calendar
    await calendar.save();

    return res.status(200).json({
      message: "Event updated successfully",
      updatedCalendar: calendar,
    });
  } catch (error) {
    console.error("Error updating offline event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteOfflineEvent = async (req, res) => {
  try {
    const { event_id } = req.body; // Extract parameters

    if (!event_id) {
      return res
        .status(400)
        .json({ message: "Missing event_id" });
    }

    //delete the calendar by event_id
    await Calendar.deleteOne({ event_id });

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVendorBookings = async (req, res) => {
  try {
    const { service_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ message: "service_id is required" });
    }

    // Fetch offline bookings from Calendar collection
    const offlineBookings = await Calendar.find({ 
      service_id,
      event_source: "EXTERNAL" 
    });

    // Fetch online bookings from Events collection
    const onlineBookings = await Events.find({ service_id });

    const totalBookings = offlineBookings.length + onlineBookings.length;

    // Respond
    return res.status(200).json({
      success: true,
      totalBookings: totalBookings,
      offlineCount: offlineBookings.length,
      onlineCount: onlineBookings.length,
      offlineBookings,
      onlineBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/bookings/get-by-id/:event_id
export const getBookingById = async (req, res) => {
  try {
    const { event_id } = req.params;
    if (!event_id) return res.status(400).json({ message: "Event ID is required" });

    // 1) Load event
    const booking = await Events.findOne({ event_id });
    if (!booking) return res.status(404).json({ message: "Event not found" });

    // 2) Resolve service model by service_id prefix
    const sid = booking.service_id || "";
    let serviceModel = null;
    if (sid.startsWith("CAT")) {
      const { Caterer } = await import("../models2/caterer.js");
      serviceModel = Caterer;
    } else if (sid.startsWith("DECO")) {
      const { Decorator } = await import("../models2/decorator.js");
      serviceModel = Decorator;
    } else if (sid.startsWith("VNP")) {
      const { default: VenueProvider } = await import("../models2/venueProvider.js");
      serviceModel = VenueProvider;
    } else if (sid.startsWith("PAV")) {
      const { default: PhotographerVideographer } = await import("../models2/photographerVideographer.js");
      serviceModel = PhotographerVideographer;
     } else if (sid.startsWith("MKA")) {
       const { default: MakeupArtist } = await import("../models2/makeupArtist.js");
       serviceModel = MakeupArtist;
     } else if (sid.startsWith("DJS")) {
       const { default: DjArtist } = await import("../models2/djArtist.js");
       serviceModel = DjArtist;
     } else if (sid.startsWith("PRO")) {
      const { default: PropRental } = await import("../models/props.js");
      serviceModel = PropRental;
    } else {
      serviceModel = null; // Unknown type; continue without service
    }

    // 3) Load service document if model found
    let service = null;
    if (serviceModel) {
      service = await serviceModel.findOne({ service_id: sid });
    }

    // 4) Respond with unified payload
    return res.status(200).json({ booking, service });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getBookingsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const bookings = await Events.find({ customer_id });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings by customerId:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// rm admin api for getting services of a vendor
// NOT UPDATED YET 
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
//to be done
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

// ---------------------- UPDATE EVENT PAYMENT DETAILS ----------------------
export const updateEventPaymentDetails = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { paymentDetails, payment_method_details } = req.body;

    // Validate required payment details fields
    if (!paymentDetails && !payment_method_details) {
      return res.status(400).json({ 
        message: "Either paymentDetails or payment_method_details is required" 
      });
    }

    const updateFields = {};
    if (paymentDetails) {
      updateFields.paymentDetails = paymentDetails;
    }
    if (payment_method_details) {
      updateFields.payment_method_details = payment_method_details;
    }

    const updatedEvent = await Events.findOneAndUpdate(
      { event_id },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ 
      message: "Event payment details updated successfully", 
      data: updatedEvent 
    });
  } catch (error) {
    console.error("Failed to update event payment details:", error);
    res.status(500).json({ 
      message: "Failed to update event payment details", 
      error: error.message 
    });
  }
};