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
        hour: { type: Number, required: true, min: 0, max: 23 }, // Hour (0-23)
        minute: { type: Number, required: true, min: 0, max: 59 }, // Minute (0-59)
      },
      closingTime: {
        hour: { type: Number, required: true, min: 0, max: 23 }, // Hour (0-23)
        minute: { type: Number, required: true, min: 0, max: 59 }, // Minute (0-59)
      },
    },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    description: { type: String },
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
    advanceBookingPeriod: {
      ll: { type: Number, required: true }, // Lower limit of advance booking period (e.g., days)
      ul: { type: Number, required: true }, // Upper limit of advance booking period (e.g., days)
    },
    priceStartingFrom: { type: Number, required: true }, // Starting price as an integer
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    insurancePolicy: { type: [String] },
  },
  reviews: [
    {
      rating: { type: Number, required: true },
      name: { type: String, required: true },
      feedback: { type: String, required: true },
      photos: { type: [String] },
      date: { type: String, required: true },
    },
  ],
});

const Venue = model("Venue", venueSchema);

export { Venue, venueSchema };
