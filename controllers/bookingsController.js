import { Booking } from "../models/bookings.js";
import { Caterer } from "../models/caterer.js";
import { Decorator } from "../models/decoraters.js";
import Photographer from "../models/photographers.js";
import PropRental from "../models/props.js";
import { Venue } from "../models/venue.js";

const vendorModels = {
  caterer: Caterer,
  decorator: Decorator,
  "venue-provider": Venue,
  "prop-rental": PropRental,
  pav: Photographer,
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
    console.log("Queried booking:", booking);

    if (!booking) {
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

    console.log("Received service ID:", serId);

    if (!serId) {
      return res.status(400).json({ message: "Please provide service ID" });
    }

    const booking = await Booking.find({ serviceId: serId });
    console.log("Queried booking:", booking);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  const { serid } = req.query; // Retrieve the service id from the query parameters
  const { bookingId, calendarEvent, vendorType } = req.body; // Expecting a bookingId and calendarEvent from the request body

  try {
    // Find the venue by the serid
    const model = vendorModels[vendorType];
    console.log(model);
    const venue = await model.findOne({ id: serid });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const bookingIdNum = Number(bookingId); // Ensure the bookingId is a number
    const eventIndex = venue.schedule.findIndex(
      (event) => event.id === bookingIdNum,
    );

    if (eventIndex !== -1) {
      venue.schedule[eventIndex] = {
        ...venue.schedule[eventIndex],
        ...calendarEvent,
      };
      await venue.save();
      return res.status(200).json({
        message: "Event updated successfully",
        event: venue.schedule[eventIndex],
      });
    } else {
      venue.schedule.push(calendarEvent);
      await venue.save();
      return res
        .status(201)
        .json({ message: "Event added successfully", event: calendarEvent });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: err.message });
  }
};

export const deleteSchedule = async (req, res) => {
  const { bookingId, serid, vendorType } = req.body; // Expecting a bookingId from the request body

  try {
    // Find the venue by the serid
    const model = vendorModels[vendorType];
    console.log(model);
    const venue = await model.findOne({ id: serid });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const bookingIdNum = Number(bookingId); // Ensure the bookingId is a number
    const eventIndex = venue.schedule.findIndex(
      (event) => event.id === bookingIdNum,
    );

    if (eventIndex !== -1) {
      // Remove the event from the schedule array
      venue.schedule.splice(eventIndex, 1);
      await venue.save();
      return res.status(200).json({ message: "Event deleted successfully" });
    } else {
      return res.status(404).json({ message: "Event not found" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: err.message });
  }
};
