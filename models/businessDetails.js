import mongoose from "mongoose";

export const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  gstin: { type: String },
  panNo: { type: String },
  verificationType: { type: String, enum: ["GSTIN", "PAN", ""] },
  teamsize: { type: String, required: true },
  years: { type: String, required: true },
  businessAddress: { type: String, required: true },
  landmark: { type: String },
  pinCode: { type: Number, required: true },
  cities: { type: [String], required: true },
  annualrevenue: { type: String }, // Made optional
  bookingsPerMonth: { type: Number }, // Added with default
});