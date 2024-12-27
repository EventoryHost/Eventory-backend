import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";
const Schema = _Schema;

const pricingSchema = new Schema({
  hourly: [{ name: String, min: String, max: String }],
  deal: [{ name: String, min: String, max: String }],
  worker: [{ name: String, min: String, max: String }],
});

const propRentalSchema = new Schema({
  type: { type: String, default: "propRental" },
  basicDetails: {
    managerName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    eventSize: {
      type: String,
      required: true,
    },
  },
  serviceDetails: {
    itemCatalogue: {
      type: String,
      required: true,
    },
    customization: { type: Boolean, required: true },
    maintenance: { type: String, required: true },
    services: { type: String, required: true },
    serviceProvided: { type: [String], required: true },
  },
  additionalDetails: {
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    awardsAndRecognize: { type: String, required: false },
    clientTestimonial: { type: String, required: false },
    instaUrl: { type: String, required: false },
    websiteUrl: { type: String, required: false },
    priceStartingFrom: { type: String, required: true },
  },
  policies: {
    cancellationPolicy: { type: [String] },
    termsAndConditions: { type: [String] },
  },
  id: { type: String, default: generateUniqueId("prop"), required: true },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "propRental" },
  schedule: [eventSchema],

  furnitureAndDecor: {
    listUrl: {
      type: [String],
    },
    typeOfEvents: {
      type: [String],
    },
    furniture: {
      type: [String],
    },
    decor: {
      type: [String],
    },
  },
  tentAndCanopy: {
    listUrl: {
      type: [String],
    },
    typeOfEvents: {
      type: [String],
    },
    items: {
      type: [String],
    },
  },
  audioVisual: {
    listUrl: {
      type: [String],
    },
    typeOfEvents: {
      type: [String],
    },
    audioEquipment: {
      type: [String],
    },
    visualEquipment: {
      type: [String],
    },
    lightEquipment: {
      type: [String],
    },
  },
});

const PropRental = model("PropRental", propRentalSchema);

export default PropRental;
