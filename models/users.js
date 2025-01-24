import { mongoose, Schema as _Schema } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { businessSchema } from "./businessDetails.js";
import { bankDetailsSchema } from "./bankDetails.js";  // Import the BankDetails schema

const Schema = _Schema;

const vendorSchema = new Schema({
  id: { type: String, default: generateUniqueId("ven"), required: true },
  name: { type: String, required: true },
  mobile: { type: String },
  email: { type: String },
  businessDetails: businessSchema,
  bankDetails: bankDetailsSchema,  // Embed bank details in the vendor schema
  profilePic: { type: String },
  invoices: { type: [String], default: [] },
  serviceIds: [
    {
      serType: { type: String },
      serId: { type: String },
    },
  ],
});

export const Vendor = mongoose.model("Vendors", vendorSchema);
