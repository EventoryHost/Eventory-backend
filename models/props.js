import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const pricingSchema = new Schema({
  hourly: [{ name: String, min: String, max: String }],
  deal: [{ name: String, min: String, max: String }],
  worker: [{ name: String, min: String, max: String }],
});

const propRentalSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  managerName: {
    type: String,
    required: true,
  },
  
  workDescription: {
    type: String,
  },
  eventSize: {
    type: String,
    required: true,
  },
  itemCatalogue: {
    type: String,
    required: true,
  },
  customization: { type: Boolean, required: true },
  maintenance: { type: String, required: true },
  services: { type: String, required: true },
  photos: { type: [String], required: true },
  videos: { type: [String], required: true },
  
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
  awardsAndRecognize: { type: String, required: false },
  clientTestimonial: { type: String, required: false },
  instaUrl: { type: String, required: false },
  websiteUrl: { type: String, required: false },

  cancellationPolicy: { type: [String] },
  termsAndConditions: { type: [String] },
});

const PropRental = model("PropRental", propRentalSchema);

export default PropRental;
