import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const transportSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  contactPersonName: {
    type: String,
    required: true,
    trim: true,
  },
  numberOfWorkers: {
    type: Number,
    required: true,
  },
  descriptionOfPastWork: {
    type: String,
    trim: true,
  },
  portfolio: {
    type: String,
    trim: true,
  },
  heavyVehicles: [
    {
      name: {
        type: String,
        trim: true,
      },
      number: {
        type: String,
        trim: true,
      },
    },
  ],
  vehicleTypes: {
    type: [String],
    default: [],
  },
  brands: {
    type: [String],
    default: [],
  },
  models: {
    type: [String],
    default: [],
  },
  packageRates: {
    vehicle: [{ name: String, min: String, max: String }],
    service: [{ name: String, min: String, max: String }],
    cargo: [{ name: String, min: String, max: String }],
  },
  advancePayment: { type: String },

  termsAndConditions: {
    type: String,
  },
  cancellationPolicy: {
    type: String,
  },
});

const Transport = model("Transport", transportSchema);

export default { Transport, transportSchema };
