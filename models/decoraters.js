import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";

const decoratorSchema = Schema({
  type: { type: String, default: "decorator" },
  isVerified: { type: Boolean, default: false },
  basicDetails: {
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    eventSize: {
      ul: { type: Number, required: true }, // Upper limit
      ll: { type: Number, required: true }, // Lower limit
    },
    description: { type: String, required: true },
    duration: { type: String },
    eventTypes: {
      types: { type: [String], default: [], required: true },
      wedding: { type: [String] },
      corporate: { type: [String] },
      seasonal: { type: [String] },
      cultural: { type: [String] },
    },
    location: {
      lat: { type: Number }, // Latitude
      lng: { type: Number }, // Longitude
      pincode: {
        type: Number,
        validate: {
          validator: function (v) {
            return /^\d{6}$/.test(v); // Ensures the pincode is exactly 6 digits
          },
          message: props => `${props.value} is not a valid 6-digit pincode!`
        },
        required: [true, 'Pincode is required'] // Ensures the pincode is required
      },
      googleMapsAddress: { type: String }, // Google Maps formatted address
    },
  },
  themesOffered: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    themesOffered: { type: [String], required: true },
    propSelection: { type: Boolean },
    customDesignProcess: { type: String },
    colorSchemeAssistance: { type: Boolean },
    themeCustomization: { type: Boolean },
    venueAdaptability: { type: Boolean },
  },
  themesElement: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    themeElements: { type: [String], required: true },
    themePhotos: { type: [String], required: true },
    themeVideos: { type: [String], required: true },
  },
  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    clientTestimonials: { type: String },
    awards: { type: String },
    website: { type: String },
    instagram: { type: String },
    advanceBookingPeriod: { type: String, required: true },
    priceStartingFrom: { type: Number, required: true }, // Changed to Number
    themeProposels: { type: Boolean },
    proposalRevisions: { type: Boolean, default: true },
  },
  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    cancellationPolicy: { type: String },
    termsAndConditions: { type: String },
  },
  id: { type: String, default: generateUniqueId("dec"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "decorator" },
  schedule: [eventSchema],
  rating: { type: Number, default: 0 }, // Added rating field
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };