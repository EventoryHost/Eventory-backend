import mongoose, { Schema as _Schema, model } from "mongoose";
import { serviceLocationSchema, policiesSchema, bankDetailsSchema, businessDetailsSchema } from "./vendor.js";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Service Location Schema for Makeup Artist
const serviceLocationMakeupSchema = new Schema({
  lat: {
    type: String,
    required: false
  },
  lon: {
    type: String,
    required: false
  },
  service_opening_time: {
    type: String, // Changed from DateTime to String to match ERD format "hh:mm"
    required: false
  },
  service_closing_time: {
    type: String, // Changed from DateTime to String to match ERD format "hh:mm"
    required: false
  },
  service_pincode: {
    type: Number,
    required: false,
    validate: {
      validator: function(v) {
        if (v === undefined || v === null) return true;
        return /^\d{6}$/.test(String(v));
      },
      message: 'Service pincode must be a 6-digit number'
    }
  },
  google_map_link: {
    type: String,
    required: false
  }
}, { _id: false });

// Event Types Makeup Schema
const eventTypesMakeupSchema = new Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true // Removed enum to match ERD which shows "String event type"
  }
}, { _id: false });

// Makeup Artist Basic Details Schema
const makeupBasicDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  point_of_contact: {
    type: String,
    required: true
  },
  service_contact_number: {
    type: String,
    required: true // Changed to required to match ERD
  },
  min_booking_capacity: {
    type: Number,
    required: true, // Changed to required to match ERD
    min: 1
  },
  max_booking_capacity: {
    type: Number,
    required: true, // Changed to required to match ERD
    min: 1
  },
  description: {
    type: String,
    required: true
  },
  event_types_makeup: [{
    type: eventTypesMakeupSchema,
    required: true
  }],
  types_of_makeup_artists_available: [{
    type: String,
    required: true
  }],
  service_location_make_up: serviceLocationMakeupSchema
}, { _id: false });

// Makeup Artist Service Details Schema
const makeupServiceDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  is_onsite_makeup_available: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  is_customization_possible: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  service_types: [{
    type: String,
    required: true
  }]
}, { _id: false });

// Makeup Artist Additional Details Schema
const makeupAdditionalDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  asset_images: [{
    type: String
  }],
  asset_videos: [{
    type: String
  }],
  min_booking_period: {
    type: Number,
    required: true // Changed to required to match ERD
  },
  max_booking_period: {
    type: Number,
    required: true // Changed to required to match ERD
  },
  prices_starts_from: {
    type: Number,
    required: true, // Changed to required to match ERD
    min: 0
  },
  ig_socials_link: {
    type: String,
    required: false
  },
  web_social_link: {
    type: String,
    required: false
  }
}, { _id: false });

// Main Makeup Artist Schema
const makeupArtistSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("MKA")
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true,
    default: "Make-up-artist" // Changed to match ERD exactly
  },
  is_active: {
    type: Boolean,
    default: true
  },
  profile_completion_score: { // Fixed typo: "completition" → "completion"
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  service_areas: [{
    type: String
  }],
  ratings: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  // Embedded bank and business details using common schemas
  bank_details: {
    type: bankDetailsSchema,
    required: false,
    default: function() {
      return {};
    }
  },
  business_details: {
    type: businessDetailsSchema,
    required: true
  },
  basic_details: {
    type: makeupBasicDetailsSchema,
    default: () => ({})
  },
  service_details: {
    type: makeupServiceDetailsSchema,
    default: () => ({})
  },
  additional_details: {
    type: makeupAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: policiesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  collection: 'makeup-artists'
});

// Indexes for better performance
makeupArtistSchema.index({ vendor_id: 1 });
makeupArtistSchema.index({ service_areas: 1 });
makeupArtistSchema.index({ is_active: 1 });
makeupArtistSchema.index({ ratings: -1 });
makeupArtistSchema.index({ profile_completion_score: -1 }); // Fixed field name in index

// Check if model already exists to prevent OverwriteModelError
const MakeupArtist = mongoose.models.MakeupArtist || 
  model('MakeupArtist', makeupArtistSchema);

export default MakeupArtist;
