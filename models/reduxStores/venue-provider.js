import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const venueSchema = new Schema({
  id: { type: String },
  pageNumber: { type: Number, default: 1 },
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
  selectedEventTypes: { type: [String] },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  serviceAreas: { type: [String] },
  description: {
    type: String,
  },
  venueType: { type: String, default: "venue-provider" },
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
  specialFeatures: { type: [String] },
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
  photos: [{ 
    original: { type: String },
    preview: { type: String }
  }],

  videos: [{ 
    original: { type: String },
    preview: { type: String }
  }],
  instagramURL: { type: String },
  websiteURL: { type: String },
  awards: { type: String },
  clientTestimonials: { type: String },
  advanceBookingPeriod: { type: String },
  priceStarts: { type: String },
  agreementUrl: { type: String }, // URL of the signed agreement PDF
  agreementSignedAt: { type: Date }, // When the agreement was signed
});

const VenueModel = model("ReduxVenueProvider", venueSchema);

export default VenueModel;
