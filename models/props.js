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
    completed: { type: Boolean, default: false }, // Flag for section completion
    profileCompletion: { type: Number, default: 0 },
    managerName: { type: String, required: true },
    description: { type: String, required: true },
    eventSize: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  serviceDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    itemCatalogue: { type: String, required: true },
    customization: { type: Boolean, required: true },
    maintenance: { type: String },
    services: { type: String },
    serviceProvided: { type: [String], required: true },
  },
  additionalDetails: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    awardsAndRecognize: { type: String, required: false },
    clientTestimonial: { type: String, required: false },
    instaUrl: { type: String, required: false },
    websiteUrl: { type: String, required: false },
    priceStartingFrom: { type: String, required: true },
  },
  policies: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    cancellationPolicy: { type: [String] },
    termsAndConditions: { type: [String] },
  },
  id: { type: String, default: generateUniqueId("prop"), required: true },
  venId: { type: String, required: true },

  vendorType: { type: String, default: "propRental" },
  schedule: [eventSchema],

  furnitureAndDecor: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    listUrl: { type: [String] },
    typeOfEvents: { type: [String] },
    furniture: { type: [String] },
    decor: { type: [String] },
  },
  tentAndCanopy: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    listUrl: { type: [String] },
    typeOfEvents: { type: [String] },
    items: { type: [String] },
  },
  audioVisual: {
    completed: { type: Boolean, default: false }, // Flag for section completion
    listUrl: { type: [String] },
    typeOfEvents: { type: [String] },
    audioEquipment: { type: [String] },
    visualEquipment: { type: [String] },
    lightEquipment: { type: [String] },
  },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "propRental" },
  schedule: [eventSchema],
  reviews: [
    {
      rating: { type: Number, required: true },
      name: { type: String, required: true },
      feedback: { type: String, required: true },
      photos: { type: [String] },
      date: { type: String, required: true },
    },
  ],
});

const PropRental = model("PropRental", propRentalSchema);

export default PropRental;
