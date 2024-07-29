import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const makeupArtistBaseSchema = {
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["individual", "group", "company"],
  },
  description: { type: String },
  types_of_artists: { type: [String] },
  packageRates: {
    hourly: [{ name: String, min: String, max: String }],
    deals: [{ name: String, min: String, max: String }],
    workers: [{ name: String, min: String, max: String }],
  },
  advancePayment: { type: String },
  onSiteAvailability: { type: Boolean },
  specialization: { type: [String] },
  portfolio: [String],
};

const createMakeupArtistSchema = (artistType) => {
  let specificFields = {};

  if (artistType === "group" || artistType === "company") {
    specificFields = {
      numberOfMembers: { type: Number, required: true },
    };
  }

  const makeupArtistSchema = new Schema({
    ...makeupArtistBaseSchema,
    ...specificFields,
  });

  return model("MakeupArtist", makeupArtistSchema);
};

export default createMakeupArtistSchema;
