import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";
const Schema = _Schema;

const photographerSchema = Schema({
  type: { type: String, default: "pav" },
  basicDetails: {
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
  },

  id: { type: String, default: generateUniqueId("pav"), required: true },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "photographer" },
  schedule: [eventSchema],

  //page 2
  Videography: {
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

  //page-5
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
