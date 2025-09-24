import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./event.js";

const djArtistSchema = Schema({
    type: { type: String, default: "djArtist" },
    isVerified: { type: Boolean, default: false },

    basicDetails: {
        profileCompletion: { type: Number, default: 0 },
        completed: { type: Boolean, default: false }, // Flag for section completion
        serviceName: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        address: { type: String, required: true },
        serviceAreas: { type: [String], required: true },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        }
    },
    serviceDetails: {
        eventTypes: { type: [String], required: true },
        musicGenres: { type: [String], },
        regionalSpecializations: { type: [String], required: true },
        servicesOffered: { type: [String], required: true },
    },
    additionalDetails:{
        photos: [
            {
                original: { type: String },
                preview: { type: String },
            },
        ],
        videos: [
            {
                original: { type: String },
                preview: { type: String },
            },
        ],
        awards : { type: String, },
        instagramUrl : { type: String, },
        websiteUrl : { type: String, },
        testimonials : { type: String, },
        priceStartingFrom: { type: Number, required: true },
    },
    policies: {
        completed: { type: Boolean, default: false }, // Flag for section completion
        termsAndConditions: { type: [String] },
        cancellationPolicy: { type: [String] },
        agreementUrl: { type: String },
        agreementSignedAt: { type: Date },
    },
    id: { type: String, default: () => generateUniqueId("dj"), required: true },
    venId: { type: String, required: true },
    vendorType: { type: String, default: "djArtist" },
    schedule: [eventSchema],
    rating: { type: Number, default: 0 }, // Added rating field
});


const DjArtist = model("DjArtist", djArtistSchema);
export default DjArtist; // ✅ Proper export