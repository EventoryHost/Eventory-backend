import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const photographerSchema = Schema({
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

  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "photographer" },

  //page 2
  Videography: {
    equipmentAvailable: {
      type: [String],
    },
    typesofstyles: {
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
    typesofstyles: {
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
    availablefordestinationevents: {
      type: Boolean,
      default: false,
    },
    Advancesetup: {
      type: Boolean,
      default: false,
    },
    postproductionservices: {
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

  //page-5
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
