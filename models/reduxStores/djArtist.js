import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

import generateUniqueId from "../../utils/generateId.js";

const djArtistSchema = Schema({
    pageNumber : { type: Number, default: 1 },
    type: { type: String, default: "djArtist" },
    isVerified: { type: Boolean, default: false },
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }, // Flag for section completion
    name: { type: String, required: true },
    contact: { type: String, required: true },
    description: { type: String, required: true},
    eventTypes: { type: [String], required: true },
    musicGenres: { type: [String],},
    regionalSpecializations: { type: [String] },
    servicesOffered: { type: [String], required: true },
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    awards : { type: String, },
    instagramURL : { type: String, },
    websiteURL : { type: String, },
    testimonials : { type: String, },
    priceStarts : { type: Number, required: true },
    termsAndConditions: { type: [String] },
    cancellationPolicy: { type: [String] },
    id: { type: String, default: generateUniqueId("dj"), required: true },
    venId: { type: String, required: true },
    vendorType: { type: String, default: "djArtist" },
});

const DjArtistModel = model("ReduxDjArtist", djArtistSchema);

export default DjArtistModel;