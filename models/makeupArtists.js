import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";

const makeupArtistSchema = Schema({
  type: { type: String, default: "makeupArtist" },
  isVerified: { type: Boolean, default: false },

  basicDetails: {
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    eventSize: { type: String, required: true },
    description: { type: String, required: true },
    eventTypes: { type: [String], required: true },
    typesOfMakeupArtists: { type: [String], required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },

  serviceDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    onsiteMakeup: { type: Boolean, required: true },
    customization: { type: Boolean, required: true },
    serviceTypes: { type: [String], required: true },
  },

  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    socialMedia: { type: String },
    websiteUrl: { type: String },
    priceStarts: { type: Number, required: true },
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    certificateOrAwards: { type: [String] },
    clientTestimonials: { type: [String] },
  },

  id: { type: String, default: generateUniqueId("mak"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "makeupArtist" },

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

const MakeupArtist = model("MakeupArtist", makeupArtistSchema);
export default MakeupArtist; // ✅ Proper export
