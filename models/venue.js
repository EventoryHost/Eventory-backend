import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const venueSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  name: {
    type: String,
    required: true,
  },
  managerName: { type: String, required: true },
  capacity: { type: String, required: true },
  operatingHours: {
    openingTime: {
      type: String,
    },
    closingTime: {
      type: String,
    },
  },
  address: { type: String, required: true },
  venueDescription: {
    type: String,
  },
  catererServices: {
    type: Boolean,
    required: true,
  },

  decorServices: {
    type: Boolean,
    required: true,
  },
  venueTypes: { type: [String], required: true },

  audioVisualEquipment: {
    type: [String],
  },
  accessibilityFeatures: {
    type: [String],
    required: true,
  },
  restrictionsPolicies: { type: [String], required: true },
  speacialFeatures: { type: [String] },
  facilities: {
    type: [String],
    required: true,
  },
  termsConditions: {
    type: [String],
  },
  cancellationPolicy: {
    type: [String],
  },
  insurancePolicy: {
    type: [String],
  },

  photos: { type: [String], required: true },
  videos: { type: [String], required: true },
  instagramURL: { type: String },
  websiteURL: { type: String },
  awards: { type: String },
  clientTestimonials: { type: String },
  advanceBookingPeriod: { type: String },
});

const Venue = model("Venue", venueSchema);

export { Venue, venueSchema };
