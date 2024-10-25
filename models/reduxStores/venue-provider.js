import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const venueSchema = new Schema({
  userId: { type: String },
  name: {
    type: String,
  },
  managerName: { type: String },
  capacity: { type: String },
  operatingHours: {
    openingTime: {
      type: String,
    },
    closingTime: {
      type: String,
    },
  },
  address: { type: String },
  venueDescription: {
    type: String,
  },
  catererServices: {
    type: Boolean,
  },

  decorServices: {
    type: Boolean,
  },
  venueTypes: { type: [String] },

  audioVisualEquipment: {
    type: [String],
  },
  accessibilityFeatures: {
    type: [String],
  },
  restrictionsPolicies: { type: [String] },
  speacialFeatures: { type: [String] },
  facilities: {
    type: [String],
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

  photos: { type: [String] },
  videos: { type: [String] },
  instagramURL: { type: String },
  websiteURL: { type: String },
  awards: { type: String },
  clientTestimonials: { type: String },
  advanceBookingPeriod: { type: String },
});

const VenueModel = model("ReduxVenueProvider", venueSchema);

export default VenueModel;
