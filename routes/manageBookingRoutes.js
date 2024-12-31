import express from 'express';
import {
  getManageBooking,
  fetchManageBooking,
  updateManageBooking,
  deleteManageBooking,
  createManageBooking, 
  getAllManageBookings
} from "../controllers/manageBookingController.js";

const router = express.Router();

// Route to create a new booking
router.post("/", createManageBooking);

// Other routes
router.get("/", getManageBooking);
router.get("/fetch", fetchManageBooking);
router.put("/:bookingId", updateManageBooking);
router.delete("/:bookingId", deleteManageBooking);
router.get("/all", getAllManageBookings);


export default router;
