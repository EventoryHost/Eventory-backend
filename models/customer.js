import { mongoose, Schema as _Schema } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const CustomerSchema = new Schema({
  id: {
    type: String,
    default: generateUniqueId("cus"),
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  state: { type: String, default: "" },
  city: { type: String, default: "" },
  address: { type: String, default: "" },
  pincode: { type: String, default: "" },
  bookings: [
    {
      serviceId: { type: String, required: true },
      bookingId: { type: String, required: true },
    },
  ],
  favoriteServices: [{ type: String }],
});

const Customer = mongoose.model("Customer", CustomerSchema);

export { Customer, CustomerSchema };
