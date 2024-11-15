import { mongoose, Schema as _Schema } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { businessSchema } from "./businessDetails.js";
const Schema = _Schema;

const vendorSchema = new Schema({
  id: { type: String, default: generateUniqueId("ven"), required: true },
  name: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  businessDetails: businessSchema,
  profilePic: { type: String },
  invoices: { type: [String], default: [] },
  serviceIds: { type: [String], default: [] },
});

export const Vendor = mongoose.model("Vendors", vendorSchema);