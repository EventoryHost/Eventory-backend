import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";
const Schema = _Schema;

const photographerSchema = Schema({
  type: { type: String, default: "pav" },
  isVerified: { type: Boolean, default: false },
  basicDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    eventSize: { type: String, required: true },
    eventTypes: {
      type: [String],
      required: true,
    },
    profileCompletion: { type: Number, default: 0 },
  },

  id: { type: String, default: generateUniqueId("pav"), required: true },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "photographer" },
  schedule: [eventSchema],

  // Page 2
  Videography: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    equipmentAvailable: {
      type: [String],
    },
    typesOfStyles: {
      type: [String],
    },
    addonsOrUpgradeAvailable: {
      type: [String],
    },
    finalDeliveryMethods: {
      type: [String],
    },
  },
  Photography: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    equipmentAvailable: {
      type: [String],
    },
    typesOfStyles: {
      type: [String],
    },
    addonsOrUpgradeAvailable: {
      type: [String],
    },
    finalDeliveryMethods: {
      type: [String],
    },
  },
  consultationDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    duration: { type: String },
    PackageTypes: {
      type: String,
      default: "Both",
    },
    proposalsToClients: {
      type: Boolean,
      default: false,
    },
    freeInitialConsultation: {
      type: Boolean,
      default: false,
    },
    bookingDeposit: {
      type: Boolean,
      default: false,
    },
    availableForDestinationEvents: {
      type: Boolean,
      default: false,
    },
    AdvanceSetup: {
      type: Boolean,
      default: false,
    },
    postProductionServices: {
      type: Boolean,
      default: false,
    },
  },
  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    clientTestimonials: { type: String },
    awards: { type: String },
    website: { type: String },
    instagram: { type: String },
    priceStartingFrom: { type: String, required: true },
    // advanceBookingPeriod: { type: String, required: true },
    // initialthemeProposels: { type: Boolean, default: false },
    // WrittenthemeProposelsafterconsultaion: { type: Boolean, default: false },
  },
  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    cancellationPolicy: {
      type: [String],
    },
    termsAndConditions: {
      type: [String],
    },
  },
  reviews: [
    {
      rating: { type: Number, required: true },
      name: { type: String, required: true },
      feedback: { type: String, required: true },
      photos: { type: [String] },
      date: { type: String, required: true },
    },
  ],

  filters: {
    price: { type: Number },
  },

  // Page-5
});

// Middleware to compute filters.price
photographerSchema.pre("save", function (next) {
  if (this.additionalDetails?.priceStartingFrom) {
    this.filters.price = parseInt(this.additionalDetails.priceStartingFrom, 10) || 0;
  }
  next();
});

photographerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.additionalDetails?.priceStartingFrom) {
    update.filters = update.filters || {};
    update.filters.price = parseInt(update.additionalDetails.priceStartingFrom, 10) || 0;
  }
  next();
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
