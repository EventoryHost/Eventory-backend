import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const giftSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  minimumOrderQuantity: {
    type: String,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  bulkQuantityAvailable: {
    type: Boolean,
    default: false,
  },
  customizableGifts: {
    type: Boolean,
    default: false,
  },
  listOfGifts: [String],

  priceRange: {
    min: {
      type: String,
    },
    max: {
      type: String,
    },
  },

  deliveryCharges: {
    max: {
      type: String,
    },
    min: {
      type: String,
    },
  },
  termsAndConditions: {
    type: String,
    trim: true,
  },
});

const Gift = model("Gift", giftSchema);

export default Gift;
