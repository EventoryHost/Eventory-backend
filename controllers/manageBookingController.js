import { ManageBooking } from '../models/manageBooking.js';

export const createManageBooking = async (req, res) => {
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
      const newBooking = new ManageBooking({
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
  

export const getManageBooking = async (req, res) => {
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

    const booking = await ManageBooking.find({ venId: venId, serviceId: serId });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchManageBooking = async (req, res) => {
  try {
    const { serId } = req.query;

    if (!serId) {
      return res.status(400).json({ message: "Please provide service ID" });
    }

    const booking = await ManageBooking.find({ serviceId: serId });

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateManageBooking = async (req, res) => {
  const { bookingId } = req.params; // Retrieve the booking ID from the URL parameters
  const updateData = req.body; // Expecting the updated data from the request body

  try {
    const updatedBooking = await ManageBooking.findByIdAndUpdate(bookingId, updateData, { new: true });

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

export const deleteManageBooking = async (req, res) => {
  const { bookingId } = req.params; // Retrieve the booking ID from the URL parameters

  try {
    const deletedBooking = await ManageBooking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getAllManageBookings = async (req, res) => {
    try {
      const bookings = await ManageBooking.find();
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving bookings", error: error.message });
    }
  };
  