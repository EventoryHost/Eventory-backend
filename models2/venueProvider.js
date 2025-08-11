import mongoose, { Schema as _Schema, model } from "mongoose";
import { bankDetailsSchema, businessDetailsSchema } from "./vendor.js";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Service Location Schema for Venue Provider
const serviceLocationVenueSchema = new Schema({
  lat: {
    type: String,
    required: false
  },
  lon: {
    type: String,
    required: false
  },
  service_opening_time: {
    type: String, // Kept as String to match ERD format "hh:mm"
    required: false
  },
  service_closing_time: {
    type: String, // Kept as String to match ERD format "hh:mm"
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

// Event Types Venue Schema
const eventTypesVenueSchema = new Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true // Removed enum to match ERD which shows "String event type"
  }
}, { _id: false });

// Venue Provider Basic Details Schema
const venueBasicDetailsSchema = new Schema({
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
  description: {
    type: String,
    required: true
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
  service_type_details: [{ // Added to match ERD field name
    type: String,
    required: true
  }],
  event_types_venue: [{
    type: eventTypesVenueSchema,
    required: true
  }],
  service_location_venue: serviceLocationVenueSchema
}, { _id: false });

// Venue Provider Feature Details Schema
const venueFeatureDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  in_house_catering: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  in_house_decoation: { // Fixed typo to match ERD exactly
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  venue_types_available: [{
    type: String,
    required: true
  }],
  av_eqp_available_at_venue: [{
    type: String
  }],
  accessibility_features_of_venue: [{
    type: String
  }],
  restriction_policies_on_venue: [{
    type: String
  }],
  special_features_in_venue: [{
    type: String
  }],
  fascilities_at_venue: [{ // Fixed typo to match ERD exactly
    type: String
  }]
}, { _id: false });

// Venue Provider Additional Details Schema
const venueAdditionalDetailsSchema = new Schema({
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

// Venue Provider Policies Schema (separate for venue providers)
const venuePoliciesSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  cancellation_policy: {
    type: String,
    required: false
  },
  terms_and_conditions: {
    type: String,
    required: false
  },
  agreement_url: {
    type: String,
    required: false
  },
  agreement_signed_at: {
    type: Date,
    required: false
  }
}, { _id: false });

// Main Venue Provider Schema
const venueProviderSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("VNP")
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true,
    default: "Venue-Provider" // Changed to match ERD exactly
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
    type: venueBasicDetailsSchema,
    default: () => ({})
  },
  feature_details: {
    type: venueFeatureDetailsSchema,
    default: () => ({})
  },
  additional_details: {
    type: venueAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: venuePoliciesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  collection: 'venue_providers'
});

// Indexes for better performance
venueProviderSchema.index({ vendor_id: 1 });
venueProviderSchema.index({ service_areas: 1 });
venueProviderSchema.index({ is_active: 1 });
venueProviderSchema.index({ ratings: -1 });
venueProviderSchema.index({ profile_completion_score: -1 }); // Fixed field name in index

// Check if model already exists to prevent OverwriteModelError
const VenueProvider = mongoose.models.VenueProvider || 
  model('VenueProvider', venueProviderSchema);

export default VenueProvider;
