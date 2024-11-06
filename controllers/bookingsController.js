import { Booking } from "../models/bookings.js";
import { Venue } from "../models/venue.js";

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

export const updateSchedule = async (req, res) => {
  const { serid } = req.query; // Retrieve the service id from the query parameters
  const { bookingId, calendarEvent } = req.body; // Expecting a bookingId and calendarEvent from the request body

  try {
    // Find the venue by the serid
    const venue = await Venue.findOne({ id: serid });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const bookingIdNum = Number(bookingId); // Ensure the bookingId is a number
    const eventIndex = venue.schedule.findIndex(
      (event) => event.id === bookingIdNum
    );

    if (eventIndex !== -1) {
      venue.schedule[eventIndex] = {
        ...venue.schedule[eventIndex],
        ...calendarEvent,
      };
      await venue.save();
      return res
        .status(200)
        .json({
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
