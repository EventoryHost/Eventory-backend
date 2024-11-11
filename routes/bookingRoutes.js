import express from "express";
import { deleteSchedule, getBooking, updateSchedule } from "../controllers/bookingsController.js";

const router = express.Router();

router.get("/getbookings", getBooking);
router.post("/schedule",updateSchedule);
router.delete("/schedule/delete",deleteSchedule)

export default router;
