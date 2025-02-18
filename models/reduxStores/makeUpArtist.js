import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

import generateUniqueId from "../../utils/generateId.js";

const makeupArtistSchema = Schema({
  pageNumber: { type: Number, default: 1 },
  type: { type: String, default: "makeupArtist" },
  isVerified: { type: Boolean, default: false },
  profileCompletion: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }, // Flag for section completion
  name: { type: String, required: true },
  eventSize: { type: String, required: true },
  description: { type: String, required: true },
  eventTypes: { type: [String], required: true },
  typesOfMakeupArtists: { type: [String], required: true },
  onsiteMakeup: { type: Boolean, required: true },
  customization: { type: Boolean, required: true },
  serviceTypes: { type: [String], required: true },
  photos: { type: [String], required: true },
  videos: { type: [String], required: true },
  socialMedia: { type: String },
  websiteUrl: { type: String },
  priceStarts: { type: String },
  termsAndConditions: { type: [String] },
  cancellationPolicy: { type: [String] },
  certificateOrAwards: { type: [String] },
  clientTestimonials: { type: [String] },
  id: { type: String, default: generateUniqueId("mak"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "makeupArtist" },
});

const MakeupArtistModel = model("ReduxMakeupArtist", makeupArtistSchema);
export default MakeupArtistModel;
