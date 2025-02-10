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
    priceStartingFrom: { type: String, required: true },
    themeProposels: { type: Boolean },
    proposalRevisions: { type: Boolean },
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
  reviews: [
    {
      rating: { type: Number, required: true },
      name: { type: String, required: true },
      feedback: { type: String, required: true },
      photos: { type: [String] },
      date: { type: Date, required: true },
    },
  ],

  // Added filter field for startingPrice
  filters: {
    startingPrice: { type: Number },
  },
});

decoratorSchema.pre("save", function (next) {
  if (this.additionalDetails?.priceStartingFrom) {
    this.filters.startingPrice =
      parseInt(this.additionalDetails.priceStartingFrom, 10) || 0;
  }
  next();
});

decoratorSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  this.options.runValidators = true;

  if (update.additionalDetails?.priceStartingFrom) {
    update.filters = update.filters || {};
    update.filters.startingPrice =
      parseInt(update.additionalDetails.priceStartingFrom, 10) || 0;
  }

  this.setUpdate(update);
  next();
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };
