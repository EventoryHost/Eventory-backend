import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

import generateUniqueId from "../../utils/generateId.js";

const makeupArtistSchema = Schema({
  pageNumber: { type: Number, default: 1 },
  type: { type: String, default: "makeupArtist" },
  isVerified: { type: Boolean, default: false },
  profileCompletion: { type: Number, default: 0 },
  address: { type: String },
  longitude: { type: Number },
  latitude: { type: Number },
  completed: { type: Boolean, default: false }, // Flag for section completion
  name: { type: String },
  eventSize: { type: String },  description: { type: String },
  eventTypes: { type: [String] },
  typesOfMakeupArtists: { type: [String] },
  serviceAreas: { type: [String] },
  onsiteMakeup: { type: Boolean },
  customization: { type: Boolean },
  serviceTypes: { type: [String] },
  photos: { type: [String] },
  videos: { type: [String] },
  socialMedia: { type: String },
  websiteUrl: { type: String },
  priceStarts: { type: String },
  termsAndConditions: { type: [String] },
  cancellationPolicy: { type: [String] },
  certificateOrAwards: { type: [String] },
  clientTestimonials: { type: [String] },
  agreementUrl: { type: String }, // URL of the signed agreement PDF
  agreementSignedAt: { type: Date }, // When the agreement was signed
  id: { type: String, default: generateUniqueId("mak") },
  venId: { type: String },
  vendorType: { type: String, default: "makeupArtist" },
});

const MakeupArtistModel = model("ReduxMakeupArtist", makeupArtistSchema);
export default MakeupArtistModel;
