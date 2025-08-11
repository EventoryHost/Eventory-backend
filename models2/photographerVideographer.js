import mongoose, { Schema as _Schema, model } from "mongoose";
import { serviceLocationSchema, policiesSchema, bankDetailsSchema, businessDetailsSchema } from "./vendor.js";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Service Location Schema for PAV
const serviceLocationPAVSchema = new Schema({
  lat: {
    type: String,
    required: false
  },
  lon: {
    type: String,
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

// Event Types Captured Schema
const eventTypesCapturedSchema = new Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true // Removed enum to match ERD which shows "String event type"
  }
}, { _id: false });

// PAV Service Types Details Schema
const pavServiceTypesDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false // Changed from "Y/N" to boolean to match ERD
  },
  type_of_service: {
    type: String,
    enum: ["photography", "videography"],
    required: true
  },
  types_of_equipment_available: [{
    type: String,
    required: true
  }],
  types_of_styles_offered: [{
    type: String,
    required: true
  }],
  add_ons_upgrade_available: [{
    type: String
  }],
  final_delivery_methods: [{
    type: String,
    required: true
  }]
}, { _id: false });

// PAV Basic Details Schema
const pavBasicDetailsSchema = new Schema({
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
  service_type_details: [{
    type: pavServiceTypesDetailsSchema, // Array of service type details
    required: true
  }],
  event_types_captured: [{
    type: eventTypesCapturedSchema,
    required: true
  }],
  service_location_pav: serviceLocationPAVSchema
}, { _id: false });

// PAV Service Details Schema (keeping for structure consistency)
const pavServiceDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  service_type_details: [{
    type: pavServiceTypesDetailsSchema,
    required: true
  }]
}, { _id: false });

// PAV Additional Details Schema
const pavAdditionalDetailsSchema = new Schema({
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

// PAV Consultations Details Schema
const pavConsultationsDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  service_offering_type: {
    type: String,
    enum: ['Customize', 'Standard', 'Both'],
    required: true // Changed to required to match ERD
  },
  send_proposals_to_clients: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  do_initial_customer_consultation: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  do_destination_events: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  do_advance_setup: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  do_post_production_services: {
    type: Boolean,
    required: true // Changed to required to match ERD
  },
  delivery_timeline: {
    type: String,
    required: true // Changed to required to match ERD
  }
}, { _id: false });

// Main Photographer and Videographer Schema
const photographerVideographerSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("PAV")
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    required: true,
    default: "Photographer-Videographer" // Changed to match ERD exactly
  },
  is_active: {
    type: Boolean,
    default: true // Changed to true to match ERD default
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
    type: pavBasicDetailsSchema,
    default: () => ({})
  },
  service_details: {
    type: pavServiceDetailsSchema,
    default: () => ({})
  },
  consultation_services: {
    type: pavConsultationsDetailsSchema,
    default: () => ({})
  },
  additional_details: {
    type: pavAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: policiesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  collection: 'photographer-videographers'
});

// Indexes for better performance
photographerVideographerSchema.index({ vendor_id: 1 });
photographerVideographerSchema.index({ service_areas: 1 });
photographerVideographerSchema.index({ is_active: 1 });
photographerVideographerSchema.index({ ratings: -1 });
photographerVideographerSchema.index({ profile_completion_score: -1 }); // Fixed field name in index

// Check if model already exists to prevent OverwriteModelError
const PhotographerVideographer = mongoose.models.PhotographerVideographer || 
  model('PhotographerVideographer', photographerVideographerSchema);

export default PhotographerVideographer;
