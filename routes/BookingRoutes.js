import express from 'express';
import {
  getBooking,
  fetchBooking,
  updateBooking,
  deleteBooking,
  createBooking, 
  getAllBookings
} from "../controllers/BookingController.js";

const router = express.Router();

// Route to create a new booking
router.post("/", createBooking);

// Other routes
router.get("/", getBooking);
router.get("/fetch", fetchBooking);
router.put("/:bookingId", updateBooking);
router.delete("/:bookingId", deleteBooking);
router.get("/all", getAllBookings);


export default router;
