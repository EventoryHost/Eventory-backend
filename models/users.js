import { mongoose, Schema as _Schema } from "mongoose";
import { businessSchema } from "./businessDetails.js";
const Schema = _Schema;

const generateUniqueId = () => {
  const now = new Date();
  const { year, month, day, hours, minutes, seconds } = {
    year: now.getFullYear().toString().padStart(4, "0"),
    month: (now.getMonth() + 1).toString().padStart(2, "0"),
    day: now.getDate().toString().padStart(2, "0"),
    hours: now.getHours().toString().padStart(2, "0"),
    minutes: now.getMinutes().toString().padStart(2, "0"),
    seconds: now.getSeconds().toString().padStart(2, "0"),
  };

  return `ven${year}${month}${day}${hours}${minutes}${seconds}`;
};

const vendorSchema = new Schema({
  id: { type: String, default: generateUniqueId, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  businessDetails: businessSchema,
});

export const Vendor = mongoose.model("Vendors", vendorSchema);
