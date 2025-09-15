import mongoose from "mongoose";

export const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNo: { type: String, required: true },
  ifscCode: { type: String, required: true },
  beneficiaryId: { type: String, required: true },
});
