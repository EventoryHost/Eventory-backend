import express from "express";
import { getBooking, updateSchedule } from "../controllers/bookingsController.js";

const router = express.Router();

router.get("/getbookings", getBooking);
router.post("/schedule",updateSchedule)

export default router;
