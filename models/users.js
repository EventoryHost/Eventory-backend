import { mongoose, Schema as _Schema } from "mongoose";
const Schema = _Schema;

const generateUniqueId = () => {
  const now = new Date();
  const { year, month, day, hours, minutes, seconds } = {
    year: now.getFullYear().toString().padStart(4, '0'),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    day: now.getDate().toString().padStart(2, '0'),
    hours: now.getHours().toString().padStart(2, '0'),
    minutes: now.getMinutes().toString().padStart(2, '0'),
    seconds: now.getSeconds().toString().padStart(2, '0')
  };

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const vendorSchema = new Schema({
  cus_id: { type: String, default: generateUniqueId }, 
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },

});

export const Vendor = mongoose.model("Vendors", vendorSchema);
