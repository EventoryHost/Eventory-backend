import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const venueSchema = new Schema({
  id: { type: String, required: true },
  name: {
    type: String,
    required: true,
  },
  operatingHours: {
    openingTime: {
      type: String,
      required: true,
    },
    closingTime: {
      type: String,
      required: true,
    },
  },
  venueDescription: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  decorServices: {
    type: String,
    required: true,
  },
  audioVisualEquipment: {
    type: [String],
    required: true,
  },
  accessibilityFeatures: {
    type: [String],
    required: true,
  },
  facilities: {
    type: [String],
    required: true,
  },
  termsConditions: {
    type: String,
    required: true,
  },
  cancellationPolicy: {
    type: String,
    required: true,
  },
  rates: {
    hourly: String,
    daily: String,
    seasonal: String,
  },

  photosVideos: [String],
  virtualTour: String,

  socialLinks: {
    instagramURL: String,
    websiteURL: String,
  },
  restrictionsPolicies: [String],
  specialFeatures: [String],
});

const Venue = model("Venue", venueSchema);

export default Venue;
