import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./event.js";

const makeupArtistSchema = Schema({
  type: { type: String, default: "makeupArtist" },
  isVerified: { type: Boolean, default: false },

  basicDetails: {
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    eventSize: {
      ll: { type: Number, required: true },
      ul: { type: Number, required: true },
    },    description: { type: String, required: true },
    eventTypes: { type: [String], required: true },
    typesOfMakeupArtists: { type: [String], required: true },
    serviceAreas: { type: [String], required: true },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
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
      googleMapsAddress: { type: String },
    },
  },

  serviceDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    onsiteMakeup: { type: Boolean, required: true },
    customization: { type: Boolean, required: true },
    serviceTypes: { type: [String], required: true },
  },

  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: [{ 
      original: { type: String },
      preview: { type: String }
    }],
    videos: { type: [String], required: true },
    socialMedia: { type: String },
    websiteUrl: { type: String },
    priceStartingFrom: { type: Number, required: true },
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    certificateOrAwards: { type: [String] },
    clientTestimonials: { type: [String] },
    agreementUrl: { type: String },
    agreementSignedAt: { type: Date },
  },

  id: { type: String, default: () => generateUniqueId("mak"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "makeupArtist" },

  schedule: [eventSchema],
  rating: { type: Number, default: 0, min: 0, max: 5 },

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

// const MakeupArtist = model("MakeupArtist", makeupArtistSchema);

const MakeupArtist = model("MakeupArtists", makeupArtistSchema);
export default MakeupArtist; // ✅ Proper export
