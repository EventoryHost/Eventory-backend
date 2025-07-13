import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import generateUniqueId from "../utils/generateId.js";

const djArtistSchema = Schema({
    type: { type: String, default: "djArtist" },
    isVerified: { type: Boolean, default: false },

    basicDetails: {
        profileCompletion: { type: Number, default: 0 },
        completed: { type: Boolean, default: false }, // Flag for section completion
        name: { type: String, required: true },
        contact: { type: String, required: true },
        description: { type: String, required: true},  
        address: { type: String, required: true },  
        serviceAreas: { type: [String], required: true },
        location: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        }
    },
    serviceDetails:{
         eventTypes: { type: [String], required: true },
         musicGenres: { type: [String],},
         regionalSpecializations: { type: [String], required: true },
         servicesOffered: { type: [String], required: true },  
    },
    additionalDetails:{
        photos: { type: [String], required: true },
        videos: { type: [String], required: true },
        awards : { type: String, },
        instagramUrl : { type: String, },
        websiteUrl : { type: String, },
        testimonials : { type: String, },
        priceStarts : { type: Number, required: true },
    },
    policies:{
        completed: { type: Boolean, default: false }, // Flag for section completion
        termsAndConditions: { type: [String] },
        cancellationPolicy: { type: [String] },
   },
    id: { type: String, default: generateUniqueId("dj"), required: true },
    venId: { type: String, required: true },
    vendorType: { type: String, default: "djArtist" },
});


const DjArtist = model("DjArtist", djArtistSchema);
export default DjArtist; // ✅ Proper export