import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const pricingSchema = new Schema({
  hourly: [{ name: String, min: String, max: String }],
  deal: [{ name: String, min: String, max: String }],
  worker: [{ name: String, min: String, max: String }],
});

const propRentalSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  contactPersonName: {
    type: String,
    required: true,
  },
  contactPhoneNumber: {
    type: String,
    required: true,
  },
  descriptionOfWork: {
    type: String,
  },
  yearsOfExperience: {
    type: String,
    required: true,
  },
  numberOfWorkers: {
    type: String,
  },
  furnitureAndDecor: {
    listUrl: {
      type: [String],
    },
    furniture: {
      type: [String],
    },
    decor: {
      type: [String],
    },
    packageRates: pricingSchema,
  },
  tentAndCanopy: {
    listUrl: {
      type: [String],
    },
    items: {
      type: [String],
    },
    packageRates: pricingSchema,
  },
  audioVisual: {
    listUrl: {
      type: [String],
    },
    audioEquipment: {
      type: [String],
    },
    visualEquipment: {
      type: [String],
    },
    lightEquipment: {
      type: [String],
    },
    packageRates: pricingSchema,
  },
  insurancePolicy: { type: [String] },
  cancellationPolicy: { type: [String] },
  termsAndConditions: { type: [String] },
  privacyPolicy: { type: [String] },
});

const PropRental = model("PropRental", propRentalSchema);

export default PropRental;
