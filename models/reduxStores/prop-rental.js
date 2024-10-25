import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const pricingSchema = new Schema({
  hourly: [{ name: String, min: String, max: String }],
  deal: [{ name: String, min: String, max: String }],
  worker: [{ name: String, min: String, max: String }],
});

const propRentalSchema = new Schema(
  {
    userId: { type: String },
    managerName: {
      type: String,
    },

    workDescription: {
      type: String,
    },
    eventSize: {
      type: String,
    },
    itemCatalogue: {
      type: String,
    },
    customization: { type: Boolean },
    maintenance: { type: String },
    serviceProvided: { type: [String] },
    photos: { type: [String] },
    videos: { type: [String] },

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
    awardsAndRecognize: { type: String, required: false },
    clientTestimonial: { type: String, required: false },
    instaUrl: { type: String, required: false },
    websiteUrl: { type: String, required: false },

    cancellationPolicy: { type: [String] },
    termsAndConditions: { type: [String] },
  },
  { timestamps: true },
);

const PropRentalModel = model("ReduxPropRental", propRentalSchema);

export default PropRentalModel;
