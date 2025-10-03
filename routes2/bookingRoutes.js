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
} from "../controllers2/bookingController.js";

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               vendor_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               booking_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *             required:
 *               - user_id
 *               - vendor_id
 *               - service_id
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", createBooking);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings (filtered)
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get("/", getBooking);

/**
 * @swagger
 * /api/bookings/fetch:
 *   get:
 *     summary: Fetch bookings (custom filter)
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Bookings fetched
 */
router.get("/fetch", fetchBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   put:
 *     summary: Update a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.put("/:bookingId", updateBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   delete:
 *     summary: Delete a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted
 */
router.delete("/:bookingId", deleteBooking);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (admin)
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: List of all bookings
 */
router.get("/all", getAllBookings);

/**
 * @swagger
 * /api/bookings/add-offline-booking:
 *   patch:
 *     summary: Add an offline booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_name:
 *                 type: string
 *               vendor_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offline event added
 */
router.patch("/add-offline-booking", addOfflineEvent);

/**
 * @swagger
 * /api/bookings/delete-offline-booking:
 *   patch:
 *     summary: Delete an offline booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offline event deleted
 */
router.patch("/delete-offline-booking", deleteOfflineEvent);

/**
 * @swagger
 * /api/bookings/edit-offline-booking:
 *   patch:
 *     summary: Edit an offline booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: string
 *               event_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offline event updated
 */
router.patch("/edit-offline-booking", editOfflineEvent);

/**
 * @swagger
 * /api/bookings/get-vendor-bookings:
 *   get:
 *     summary: Get all bookings for a vendor
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Vendor bookings retrieved
 */
router.get("/get-vendor-bookings", getVendorBookings);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/:bookingId', getBookingById);

/**
 * @swagger
 * /api/bookings/customer/{customerId}:
 *   get:
 *     summary: Get bookings for a customer
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer's bookings
 */
router.get("/customer/:customerId", getBookingsByCustomer);

/**
 * @swagger
 * /api/bookings/vendor/all-schedules:
 *   post:
 *     summary: Get all service schedules for a vendor
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: All vendor service schedules retrieved
 */
router.post("/vendor/all-schedules", getAllVendorServiceSchedules);

export default router;
