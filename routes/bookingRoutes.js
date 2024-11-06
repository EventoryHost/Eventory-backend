import express from "express";
import { getBooking } from "../controllers/bookingsController.js";

const router = express.Router();

router.get("/getbookings", getBooking);

export default router;
