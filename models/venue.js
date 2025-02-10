import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

export const eventSchema = new Schema({
  calendarId: { type: String }, // Example: "upcoming"
  end: { type: String, required: true }, // End time, e.g., "2024-11-06 20:30"
  id: { type: Number, required: true }, // Unique event id
  start: { type: String, required: true }, // Start time, e.g., "2024-11-06 19:30"
  title: { type: String, required: true }, // Event title
});

const venueSchema = new Schema({
  id: { type: String, default: generateUniqueId("veu"), required: true },
  type: { type: String, default: "venue" },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "venue" },
  schedule: [eventSchema],

  basicDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    capacity: { type: String, required: true },
    operatingHours: {
      openingTime: { type: String },
      closingTime: { type: String },
    },
    address: { type: String, required: true },
    description: { type: String },
    profileCompletion: { type: Number, default: 0 },
  },

  featureDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    catererServices: { type: Boolean, required: true },
    decorServices: { type: Boolean, required: true },
    venueTypes: { type: [String], required: true },
    audioVisualEquipment: { type: [String] },
    accessibilityFeatures: { type: [String], required: true },
    restrictionsPolicies: { type: [String], required: true },
    specialFeatures: { type: [String] },
    facilities: { type: [String], required: true },
  },

  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    awards: { type: String },
    clientTestimonials: { type: String },
    instagramURL: { type: String },
    websiteURL: { type: String },
    advanceBookingPeriod: { type: String },
    priceStartingFrom: { type: String, required: true },
  },

  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    termsConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    insurancePolicy: { type: [String] },

    reviews: [
      {
        rating: { type: Number, required: true },
        name: { type: String, required: true },
        feedback: { type: String, required: true },
        photos: { type: [String] },
        date: { type: String, required: true },
      },
    ],
  },

  //added a seperate field helpful while filtering
  filters: {
    startingPrice: { type: Number },
    guestCapacity: {
      ll: { type: Number, default: 1 }, //lower limit
      ul: { type: Number, default: 100000 }, //upper limit
    },
  },
});

venueSchema.pre("save", function (next) {
  if (this.additionalDetails?.priceStartingFrom) {
    this.filters.startingPrice =
      parseInt(this.additionalDetails.priceStartingFrom, 10) || 0;
  }

  //before saving the document compute the ll and ul and add it to the filter field
  if (this.basicDetails?.capacity) {
    const capacityRange = this.basicDetails.capacity.match(
      /^(\d+)-(\d+)\s*persons$/,
    );
    if (capacityRange) {
      this.filters.guestCapacity.ll = parseInt(capacityRange[1], 10);
      this.filters.guestCapacity.ul = parseInt(capacityRange[2], 10);
    } else {
      return next(
        new Error("Invalid capacity format. Expected format: 'min-max'"),
      );
    }
  }
  next();
});

venueSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  this.options.runValidators = true; // Ensures validation runs on update

  //after updating the doccument compute the price and add it to the filter field
  if (update.additionalDetails?.priceStartingFrom) {
    update.filters = update.filters || {};
    update.filters.startingPrice =
      parseInt(update.additionalDetails.priceStartingFrom, 10) || 0;
  }

  if (update.basicDetails?.capacity) {
    const capacityRange = update.basicDetails.capacity.match(
      /^(\d+)-(\d+)\s*persons$/,
    );
    if (capacityRange) {
      update.filters = update.filters || {};
      update.filters.guestCapacity = {
        ll: parseInt(capacityRange[1], 10),
        ul: parseInt(capacityRange[2], 10),
      };
    } else {
      return next(
        new Error("Invalid capacity format. Expected format: 'min-max'"),
      );
    }
  }

  this.setUpdate(update);
  next();
});

const Venue = model("Venue", venueSchema);
export { Venue, venueSchema };
