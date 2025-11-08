import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const djArtistSchema = Schema({
    id: { type: String, unique: true }, 
    pageNumber: { type: Number, default: 1 },
    type: { type: String, default: "djArtist" },
    isVerified: { type: Boolean, default: false },
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    name: { type: String }, // Service name
    managerName: { type: String }, // Manager name
    description: { type: String },
    address: { type: String },
    serviceAreas: { type: [String] },
    pincode: { type: Number },
    latitude: { type: Number },
    longitude: { type: Number },
    eventTypes: { type: [String] },
    musicGenres: { type: [String] },
    regionalSpecializations: { type: [String] },
    servicesOffered: { type: [String] },
    photos: [
      {
        original: { type: String },
        preview: { type: String },
      },
    ],
    videos: { type: [String]},
    awards: { type: String },
    instagramURL: { type: String },
    websiteURL: { type: String },
    testimonials: { type: String },
    priceStartingFrom: { type: Number },
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    agreementUrl: { type: String },
    agreementSignedAt: { type: Date },
});

const DjArtistModel = model("ReduxDjArtist", djArtistSchema);

export default DjArtistModel;
