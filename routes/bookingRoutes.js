import express from "express";
import {
  getBooking,
  fetchBooking,
  updateBooking,
  deleteBooking,
  createBooking,
  getAllBookings,
  addOfflineEvent,
  getVendorBookings,
  deleteOfflineEvent,
  editOfflineEvent,
  getBookingById,
  getBookingsByCustomer,
  getAllVendorServiceSchedules
} from "../controllers/bookingController.js";

const router = express.Router();

// Route to create a new booking
router.post("/", createBooking);

// Other routes
router.get("/", getBooking);
router.get("/fetch", fetchBooking);
router.put("/:bookingId", updateBooking);
router.delete("/:bookingId", deleteBooking);
router.get("/all", getAllBookings);

router.patch("/add-offline-booking", addOfflineEvent);
router.patch("/delete-offline-booking", deleteOfflineEvent);
router.patch("/edit-offline-booking", editOfflineEvent);
router.get("/get-vendor-bookings", getVendorBookings);

router.get('/:bookingId', getBookingById);

router.get("/customer/:customerId", getBookingsByCustomer);

// route to fetch all the schedules of the vendor from the db from all services 
router.post("/vendor/all-schedules", getAllVendorServiceSchedules);

export default router;
