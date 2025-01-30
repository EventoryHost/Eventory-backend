import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

export const eventSchema = new Schema({
  calendarId: { type: String }, // Example: "upcoming"
  end: { type: String, required: true }, // End time, e.g., "2024-11-06 20:30"
  id: { type: Number, required: true }, // Unique event id
  start: { type: String, required: true }, // Start time, e.g., "2024-11-06 19:30"
  title: { type: String, required: true }, // Event title
});

const venueSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "venue" },
  schedule: [eventSchema],

  basicDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    capacity: { type: String, required: true },
    operatingHours: {
      openingTime: { type: String },
      closingTime: { type: String },
    },
    address: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    description: { type: String },
    profileCompletion: { type: Number, default: 0 },
  },

  featureDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    catererServices: { type: Boolean, required: true },
    decorServices: { type: Boolean, required: true },
    venueTypes: { type: [String], required: true },
    audioVisualEquipment: { type: [String] },
    accessibilityFeatures: { type: [String], required: true },
    restrictionsPolicies: { type: [String], required: true },
    specialFeatures: { type: [String] },
    facilities: { type: [String], required: true },
  },

  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    awards: { type: String },
    clientTestimonials: { type: String },
    instagramURL: { type: String },
    websiteURL: { type: String },
    advanceBookingPeriod: { type: String },
    priceStartingFrom: { type: String, required: true },
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    insurancePolicy: { type: [String] },
  },
});

const Venue = model("Venue", venueSchema);

export { Venue, venueSchema };
