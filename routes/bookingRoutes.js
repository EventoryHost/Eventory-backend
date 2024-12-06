import express from "express";
import {
  deleteSchedule,
  getBooking,
  updateSchedule,
  fetchBooking
} from "../controllers/bookingsController.js";

const router = express.Router();

router.get("/getbookings", getBooking);
router.post("/schedule", updateSchedule);
router.delete("/schedule/delete", deleteSchedule);
router.get("/fetchbookings", fetchBooking);

export default router;
