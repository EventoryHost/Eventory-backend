import mongoose from "mongoose";

export const businessSchema = new mongoose.Schema({
  userId : { type: String, required: true },
  businessName: { type: String, required: true },
  category : { type: String, required: true },
  gstin: { type: String, required: true },
  teamsize : {type :String, required: true},
  businessAddress: { type: String, required: true },
  pinCode: { type: Number, required: true },
  cities: { type: [String] },
  years: { type: String, required: true },
  annualrevenue : {type : String, required: true},

});

const BusinessDetailsModel = mongoose.model(" ", businessSchema);

export { BusinessDetailsModel };
