import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const photographerSchema = Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  //page-1
  name: {
    type: String,
    required: true,
  },
  eventSize: { type: String, required: true },
  description: { type: String },
  eventTypes: {
    type: [String],
    required: true,
  },
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
  //page-3
  duration: { type: String },
  PackageTypes: {
    type: String,
    default: "Both",
  },
  designProposals: {
    type: Boolean,
    default: false,
  },
  freeInitialConsultation: {
    type: Boolean,
    default: false,
  },
  bookingDepositRequired: {
    type: Boolean,
    default: false,
  },
  availableForOutofTownbooking: {
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
  // page-4
  photos: { type: [String], required: true },
  videos: { type: [String], required: true },
  clientTestimonials: { type: String },
  awards: { type: String },
  website: { type: String },
  instagram: { type: String },
  advanceBookingPeriod: { type: String, required: true },
  initialthemeProposels: { type: Boolean, default: false },
  WrittenthemeProposelsafterconsultaion: { type: Boolean, default: false },

  //page-5
  cancellationPolicy: {
    type: [String],
  },
  termsAndConditions: {
    type: [String],
  },
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
