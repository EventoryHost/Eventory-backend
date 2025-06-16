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
    eventSize: {
      ll: { type: Number, required: true }, // Lower limit
      ul: { type: Number, required: true }, // Upper limit
    },
    eventTypes: {
      type: [String],
      required: true,
    },
    // address: { type: String, required: true },
    // latitude: { type: Number, required: true },
    // longitude: { type: Number, required: true },
    profileCompletion: { type: Number, default: 0 },
    location: {
      lat: { type: Number }, // Latitude
      lng: { type: Number }, // Longitude
      pincode: {
        type: Number,
        required: false, // Make pincode explicitly optional
        validate: {
          validator: function (v) {
            // Skip validation if value is undefined, null, or zero
            if (v === undefined || v === null || v === 0) return true;
            // Ensure it's a 6-digit number
            return /^\d{6}$/.test(String(v));
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode!`,
        },
      },
      googleMapsAddress: { type: String }, // Google Maps formatted address
    },
  },

  id: { type: String, default: () => generateUniqueId("pav"), required: true },
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
      enum: ["Google Drive Link", "Physical Prints", "Hardware", "Others"],
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
      enum: ["Google Drive Link", "Physical Prints", "Hardware", "Others"],
    },
  },
  consultationDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    duration: {
      type: String,
      enum: [
        "Less than 1 week",
        "Less than 2 weeks",
        "2-4 weeks",
        "More than 4 weeks",
      ],
    },
    PackageTypes: {
      type: String,
      enum: ["Customize", "Standard", "Both"],
      default: "Both",
    },
    proposalsToClients: {
      type: Boolean,
    },
    freeInitialConsultation: {
      type: Boolean,
    },
    bookingDeposit: {
      type: Boolean,
    },
    availableForDestinationEvents: {
      type: Boolean,
    },
    AdvanceSetup: {
      type: Boolean,
    },
    postProductionServices: {
      type: Boolean,
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
    priceStartingFrom: { type: Number, required: true },
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

  rating: { type: Number, default: 0 }, // Added rating field
});

const Photographer = model("Photographer", photographerSchema);

export default Photographer;
