import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const BusinessDetailsSchema = new Schema({
  businessName: String,
  businessAddress: String,
  annualrevenue: String,
  bookingsPerMonth: Number,
  category: String,
  cities: [String],
  panNo: String,
  pinCode: String,
  teamsize: String,
  verificationType: String,
  years: String,
  _id: String, 
}, { _id: false }); 

const FinalizedContentSchema = new Schema({
  name: String,
  price: Number,
  description: String,
  _id: String,
}, { _id: false });

const BookingSchema = new Schema({
  bookingid: {
    type: String,
    required: true,
  },
  customerId: { type: String, required: true },
  venId: { type: String, required: true },
  serviceId: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  details: { type: String, required: true },
  guest: { type: Number, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true, default: "Pending" },
  managerName: { type: String, required: true },
  customerName: { type: String, required: true },
  description: { type: String, required: true },
  paymentDetails: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  capacity: { type: String, required: true },
  vendorBusinessDetails: { type: BusinessDetailsSchema, required: false },
  rating: { type: Number, default: 0 },
  finalizedContents: [FinalizedContentSchema],

  serviceName: { type: String, required: true },
  serviceLocation: {
    type: Object,
    required: false,
    default: {},
  },
  serviceAddress: { type: String, required: false },

  eventLocation: {type: String, required: false},
  eventTime: {type: String, required: false},

  eventType: {type: String, required: false},

  eventId: { type: String, required: false },

  // invoices: {
  //   customerInvoices: { type: [String], default: [] },
  //   vendorInvoices: { type: [String], default: [] }
  // }
});

const Booking = model("Bookings", BookingSchema);

export { Booking, BookingSchema };
