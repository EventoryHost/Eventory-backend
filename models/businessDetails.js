import mongoose from "mongoose";


export const businessSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    gstin: { type: String, required: true },
    yearsInOperation: { type: Number, required: true },
    businessAddress: { type: String, required: true },
    landmark: { type: String },
    pinCode: { type: String, required: true },
    operationalCities: { type: [String], required: true }
  });





