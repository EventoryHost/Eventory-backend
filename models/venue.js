import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const venueSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  id: { type: String, required: true },
  name: {
    type: String,
    required: true,
  },
  operatingHours: {
    openingTime: {
      type: String,
      required: true,
    },
    closingTime: {
      type: String,
      required: true,
    },
  },
  venueDescription: {
    type: String,
    required: true,
  },
  seatedCapacity: {
    type: String,
    required: true,
  },
  standingCapacity: {
    type: String,
    required: true,
  },
  decorServices: {
    type: String,
    required: true,
  },
  audioVisualEquipment: {
    type: [String],
    required: true,
  },
  accessibilityFeatures: {
    type: [String],
    required: true,
  },
  facilities: {
    type: [String],
    required: true,
  },
  termsConditions: {
    type: String,
    required: true,
  },
  cancellationPolicy: {
    type: String,
    required: true,
  },
  rates: {
    hourly: {
      type: Object,
      required: true,
      properties: {
        type: { type: String, required: true },
        priceRange: { type: [Number], required: true, minlength: 2, maxlength: 2 }
      }
    },
    daily: {
      type: Object,
      required: true,
      properties: {
        type: { type: String, required: true },
        priceRange: { type: [Number], required: true, minlength: 2, maxlength: 2 }
      }
    },
    seasonal: {
      type: Object, required: true,
      properties: {
        type: { type: String, required: true },
        priceRange: { type: [Number], required: true, minlength: 2, maxlength: 2 }
      }
    }
  },

  portfolio: [String],

  socialLinks: {
    instagramURL: String,
    websiteURL: String,
  },
  restrictionsPolicies: [String],
  specialFeatures: [String],
});

const Venue = model("Venue", venueSchema);

export {Venue, venueSchema};
