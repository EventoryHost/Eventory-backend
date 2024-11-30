import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";

const decoratorSchema = Schema({
  basicDetails: {
    name: { type: String, required: true },
    eventSize: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String },
    eventTypes: {
      types: { type: [String], default: [], required: true },
      wedding: { type: [String] },
      corporate: { type: [String] },
      seasonal: { type: [String] },
      cultural: { type: [String] },
    },
  },
  themesOffered: {
    themesOffered: { type: [String], required: true },
    propSelection: { type: Boolean },
    customDesignProcess: { type: String },
    colorSchemeAssistance: { type: Boolean },
    themeCustomization: { type: Boolean },
    venueAdaptability: { type: Boolean },
  },
  themesElement: {
    themeElements: { type: [String], required: true },
    themePhotos: { type: [String], required: true },
    themeVideos: { type: [String], required: true },
  },
  additionalDetails: {
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    clientTestimonials: { type: String },
    awards: { type: String },
    website: { type: String },
    instagram: { type: String },
    advanceBookingPeriod: { type: String, required: true },
    priceStartingFrom: { type: String, required: true },
    themeProposels: { type: Boolean },

    proposalRevisions: { type: Boolean },
  },
  policies: {
    cancellationPolicy: { type: String },
    termsAndConditions: { type: String },
  },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "decorator" },

  themeProposels: { type: Boolean, default: false },
  proposalRevisions: { type: Boolean, default: false },
  consultationProcess: { type: String },

  onlineRatings: { type: [String] },

  insurancePolicy: { type: String },

  privacyPolicy: { type: String },
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };
