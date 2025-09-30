import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./event.js";

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
    },    description: { type: String, required: true },
    duration: { type: String },
    serviceAreas: { type: [String], default: [] },
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
        required: false, // Make pincode explicitly optional
        validate: {
          validator: function (v) {
            // Skip validation if value is undefined, null, or zero
            if (v === undefined || v === null || v === 0) return true;
            // Ensure it's a 6-digit number
            return /^\d{6}$/.test(String(v));
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode!`,
        },
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
    themePhotos:  [{ 
      original: { type: String },
      preview: { type: String }
    }],
    themeVideos: { type: [String], required: true },
  },
  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: [{ 
      original: { type: String },
      preview: { type: String }
    }],
    videos: { type: [String], required: true },
    clientTestimonials: { type: String },
    awards: { type: String },
    website: { type: String },
    instagram: { type: String },
    advanceBookingPeriod: {
      ll: { type: Number, required: true },
      ul: { type: Number, required: true },
    },
    priceStartingFrom: { type: Number, required: true }, // Changed to Number
    themeProposels: { type: Boolean },
    proposalRevisions: { type: Boolean, default: true },
  },
  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    cancellationPolicy: { type: String },
    termsAndConditions: { type: String },
    agreementUrl: { type: String },
    agreementSignedAt: { type: Date },
  },
  id: { type: String, default: () => generateUniqueId("dec"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "decorator" },
  schedule: [eventSchema],
  rating: { type: Number, default: 0 }, // Added rating field
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };
