import mongoose from "mongoose";

export const businessSchema = new mongoose.Schema({
  id: { type: String, required: true },
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  gstin: { type: String },
  panNo: { type: String },
  teamsize: { type: String, required: true },
  businessAddress: { type: String, required: true },
  pinCode: { type: Number, required: true },
  cities: { type: [String] },
  years: { type: String, required: true },
  annualrevenue: { type: String }, // Made optional by removing required
  bookingsPerMonth: { type: Number, default: 0 }, // Default value for existing records
});

const BusinessDetailsModel = mongoose.model(
  " reduxBusinessDetails ",
  businessSchema,
);

export { BusinessDetailsModel };
