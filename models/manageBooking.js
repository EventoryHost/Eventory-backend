import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const manageBookingSchema = new Schema({
  bookingid: { type: String, default: generateUniqueId("#"), required: true },
  venId: { type: String, required: true },
  serviceId: { type: String, required: true },
  type: {
    type: String,
    required: true,
  },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  details: { type: String, required: true },
  guest: { type: Number, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true, default: "Pending" },
  managerName: { type: String, required: true },
  customerName: { type: String, required: true }, // New field added
  description: { type: String, required: true },
  paymentDetails: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  capacity: { type: String, required: true },
});

const ManageBooking = model("ManageBookings", manageBookingSchema);
 
export { ManageBooking, manageBookingSchema };