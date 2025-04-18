import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

export const eventSchema = new Schema({
  calendarId: { type: String, default: generateUniqueId("cal") }, // Example: "upcoming"
  end: { type: Date, required: true }, // End time, e.g., "2024-11-06 20:30"
  id: { type: Number, required: true }, // Unique event id
  start: { type: Date, required: true }, // Start time, e.g., "2024-11-06 19:30"
  description: { type: String },
  color: { type: String, enum: ["teal", "orange", "indigo", "blue", "purple"], default: "indigo" }, // Event color
  title: { type: String, required: true }, // Event title
});

const venueSchema = new Schema({
  id: {
    type: String,
    default: generateUniqueId("veu"),
    required: true,
    unique: true,
  },
  type: { type: String, default: "venue" },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "venue" },
  schedule: [eventSchema],

  basicDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    capacity: {
      ll: { type: Number, required: true }, // Lower limit of capacity
      ul: { type: Number, required: true }, // Upper limit of capacity
    },
    operatingHours: {
      openingTime: {
        hour: { type: Number, min: 0, max: 23 }, // Hour (0-23)
        minute: { type: Number, min: 0, max: 59 }, // Minute (0-59)
      },
      closingTime: {
        hour: { type: Number, min: 0, max: 23 }, // Hour (0-23)
        minute: { type: Number, min: 0, max: 59 }, // Minute (0-59)
      },
    },
    // address: { type: String, required: true },
    // latitude: { type: Number, required: true },
    // longitude: { type: Number, required: true },
    description: { type: String, required: true },
    profileCompletion: { type: Number, default: 0 },
    location: {
      lat: { type: Number }, // Latitude
      lng: { type: Number }, // Longitude
      pincode: {
        type: Number,
        validate: {
          validator: function (v) {
            return /^\d{6}$/.test(v); // Ensures the pincode is exactly 6 digits
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode!`,
        },
        // required: [true, 'Pincode is required'] // Ensures the pincode is required
      },
      googleMapsAddress: { type: String }, // Google Maps formatted address
    },
  },

  featureDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    catererServices: { type: Boolean },
    decorServices: { type: Boolean },
    eventTypes: { type: [String] },
    venueTypes: { type: [String] },
    audioVisualEquipment: { type: [String] },
    accessibilityFeatures: { type: [String] },
    restrictionsPolicies: { type: [String] },
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
    advanceBookingPeriod: {
      ll: { type: Number, required: true }, // Lower limit of advance booking period (e.g., days)
      ul: { type: Number, required: true }, // Upper limit of advance booking period (e.g., days)
    },
    priceStartingFrom: { type: Number, required: true }, // Starting price as an integer
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    insurancePolicy: { type: [String] },
  },

  rating: { type: Number, default: 0, min: 0, max: 5 }, // Aggregate rating of all reviews
});

const Venue = model("Venue", venueSchema);

export { Venue, venueSchema };
