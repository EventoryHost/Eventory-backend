import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const eventSchema = new Schema({
  calendarId: { type: String }, // Example: "upcoming"
  end: { type: String, required: true }, // End time, e.g., "2024-11-06 20:30"
  id: { type: Number, required: true }, // Unique event id
  start: { type: String, required: true }, // Start time, e.g., "2024-11-06 19:30"
  title: { type: String, required: true }, // Event title
});

const venueSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  basicDetails: {
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
    description: {
      type: String,
    },
  },

  featureDetails: {
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
  },

  additionalDetails: {
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
    termsConditions: {
      type: [String],
    },
    cancellationPolicy: {
      type: [String],
    },
    insurancePolicy: {
      type: [String],
    },
  },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "venue" },

  schedule: [eventSchema],
  priceStartingFrom: { type: String, required: true },
});

const Venue = model("Venue", venueSchema);

export { Venue, venueSchema };
