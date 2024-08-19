import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const photographerSchema = Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  numberOfMembers: {
    type: String,
  },
  clientTestimonials: {
    type: [String],
  },
  portfolio: {
    type: String,
    required: true,
  },
  specialization: {
    type: [String],
    required: true,
  },
  eventTypes: {
    type: [String],
    required: true,
  },
  customizablePackage: {
    type: Boolean,
    default: false,
  },
  customizableSoundAndLightingRates: {
    type: Boolean,
    default: false,
  },
  equipmentAvailable: {
    type: [String],
  },
  designProposals: {
    type: Boolean,
    default: false,
  },
  freeInitialConsultation: {
    type: Boolean,
    default: false,
  },
  advanceSetup: {
    type: Boolean,
    default: false,
  },
  collaborateWithVendors: {
    type: Boolean,
    default: false,
  },
  setupAndInstallation: {
    type: Boolean,
    default: false,
  },
  bookingDepositRequired: {
    type: Boolean,
    default: false,
  },
  cancellationPolicy: {
    type: String,
  },
  termsAndConditions: {
    type: String,
  },
  rates: {
    packageRates: {
      hourly: [{ name: String, min: String, max: String }],
      deals: [{ name: String, min: String, max: String }],
      workers: [{ name: String, min: String, max: String }],
    },
  },
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
