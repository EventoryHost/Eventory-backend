import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";

const decoratorSchema = Schema({
  name: { type: String, required: true },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  eventSize: { type: String, required: true },
  duration: { type: String },
  eventTypes: {
    types: { type: [String], default: [], required: true },
    wedding: { type: [String] },
    corporate: { type: [String] },
    seasonal: { type: [String] },
    cultural: { type: [String] },
  },
  themesOffered: { type: [String], required: true },
  propSelection: { type: Boolean },
  colorSchemeAssistance: { type: Boolean },
  themeCustomization: { type: Boolean },
  venueAdaptability: { type: Boolean },
  customDesignProcess: { type: String },
  themeElements: { type: [String], required: true },
  themePhotos: { type: [String], required: true },
  themeVideos: { type: [String], required: true },
  setupAndInstallation: { type: Boolean, default: false },
  proposalRevisions: { type: Boolean, default: false },
  consultationProcess: { type: String },
  advanceBookingPeriod: { type: String, required: true },
  photos: { type: [String], required: true },
  videos: { type: [String], required: true },
  clientTestimonials: { type: String },
  onlineRatings: { type: [String] },
  awards: { type: String },
  website: { type: String },
  instagram: { type: String },
  insurancePolicy: { type: String },
  cancellationPolicy: { type: String },
  termsAndConditions: { type: String },
  privacyPolicy: { type: String },
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };
