import { mongoose, Schema as _Schema } from "mongoose";
import { businessSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const vendorSchema = new Schema({
  id: { type: String, default: generateUniqueId("ven"), required: true },
  name: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  businessDetails: businessSchema,
});

export const Vendor = mongoose.model("Vendors", vendorSchema);
