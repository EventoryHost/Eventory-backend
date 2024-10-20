import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const makeupArtistBaseSchema = {
  userId: { type: String, required: true },  // ID of the user creating this entry
  type: {
    type: String,
    enum: ["individual", "group", "company"],  // Defining artist type
    required: true,
  },
  description: { type: String },  // Short description of services or expertise
  types_of_artists: { type: [String], required: true },  // Types of artists in the team, like hair, makeup, etc.
  
  // Package rates for hourly, deals, and workers
  packageRates: {
    hourly: [{ name: String, min: String, max: String }],  // Hourly package rates
    deals: [{ name: String, min: String, max: String }],  // Deal-based package rates
    workers: [{ name: String, min: String, max: String }],  // Worker-based package rates
  },

  advancePayment: { type: String },  // Advance payment requirements
  onSiteAvailability: { type: Boolean },  // Whether on-site services are offered
  specialization: { type: [String] },  // List of specializations (e.g., bridal makeup, etc.)
  portfolio: { type: [String] },  // Array of portfolio image URLs
};

// Factory function to create the schema based on artist type
const createMakeupArtistSchema = (artistType) => {
  let specificFields = {};

  // Add specific fields if artist is a group or company
  if (artistType === "group" || artistType === "company") {
    specificFields = {
      numberOfMembers: { type: Number },  // For groups or companies, number of members in the team
    };
  }

  // Combine the base schema with specific fields
  const makeupArtistSchema = new Schema({
    ...makeupArtistBaseSchema,
    ...specificFields,
  }, { timestamps: true });  // Adds createdAt and updatedAt fields

  // Create and return the model
  return model("ReduxMakeupArtist", makeupArtistSchema);
};

export default createMakeupArtistSchema;
