import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId2.js";
import { bankDetailsSchema, businessDetailsSchema } from "./vendor.js";

const Schema = _Schema;

// Event Types Catered Schema
const eventTypesCateredSchema = new Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true
  }
}, { _id: false });

// Service Location Schema for Caterers
const serviceLocationCatererSchema = new Schema({
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

// Caterer Basic Details Schema
const catererBasicDetailsSchema = new Schema({
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
    required: true
  },
  min_booking_capacity: {
    type: Number,
    required: true
  },
  max_booking_capacity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cuisine_specialities: [{
    type: String,
    required: true
  }],
  regional_specialities: [{
    type: String,
    required: true
  }],
  service_style_offered: [{
    type: String,
    required: true
  }],
  service_location_caterer: serviceLocationCatererSchema,
  event_types_catered: [eventTypesCateredSchema]
}, { _id: false });

// Caterer Menu Details Schema
const catererMenuDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  menu: [{
    type: String, // Array of S3 links
    required: true
  }],
  veg_or_nonveg: {
    type: String,
    enum: ['VEG', 'NON-VEG', 'BOTH'],
    required: true
  },
  appetizers: [{
    type: String
  }],
  main_course: [{
    type: String
  }],
  beverages: [{
    type: String
  }],
  special_dietary_options: [{
    type: String
  }],
  pre_set_menus: [{
    type: String // Array of Events for which there is pre-set menus available
  }],
  menu_customizable: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Caterer Event Details Schema
const catererEventDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  event_types_catered: [{
    type: String, // Array of Events where this vendor has given/gives
    required: true
  }],
  additional_services_for_any_event: [{
    type: String // Array of additional things vendor provides/can provide
  }]
}, { _id: false });

// Caterer Staff and Equipment Details Schema
const catererStaffEquipmentDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  staff_provided: [{
    type: String,
    required: true
  }],
  equipment_provided: [{
    type: String
  }]
}, { _id: false });

// Caterer Additional Details Schema
const catererAdditionalDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  min_booking_period: {
    type: Number, // Minimum advance Booking Period
    required: true
  },
  max_booking_period: {
    type: Number, // Maximum advance Booking Period
    required: true
  },
  asset_images: [{
    type: String, // Array of S3 links of Photos
    required: true
  }],
  asset_videos: [{
    type: String, // Array of S3 links of Videos
    required: true
  }],
  is_tasting_session_provided: {
    type: Boolean,
    required: true
  },
  is_business_license_available: {
    type: Boolean,
    default: false
  },
  food_safety_certificates: [{
    type: String // Array of S3 links
  }],
  prices_starts_from: {
    type: Number // Integer for getting values of their min item value
  }
}, { _id: false });

// Caterer Policies Schema (separate for caterers)
const catererPoliciesSchema = new Schema({
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

// Main Caterer Schema based on ERD
const catererSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("CAT")
  },
  vendor_id: {
    type: String,
    required: true,
    ref: 'Vendor'
  },
  service_type: {
    type: String,
    default: "Caterer"
  },
  is_active: {
    type: Boolean,
    default: true
  },
  profile_completion_score: {
    type: Number,
    default: 0
  },
  service_areas: [{
    type: String
  }],
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
  basic_details: catererBasicDetailsSchema,
  menu_details: catererMenuDetailsSchema,
  event_details: catererEventDetailsSchema,
  staff_and_equipment_details: catererStaffEquipmentDetailsSchema,
  additional_details: catererAdditionalDetailsSchema,
  policies: catererPoliciesSchema,
  ratings: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for better performance
catererSchema.index({ vendor_id: 1 });
catererSchema.index({ is_active: 1 });
catererSchema.index({ service_areas: 1 });

const Caterer = model("Caterers", catererSchema);

export default Caterer;
export { 
  Caterer, 
  catererSchema,
  catererBasicDetailsSchema,
  catererMenuDetailsSchema,
  catererEventDetailsSchema,
  catererStaffEquipmentDetailsSchema,
  catererAdditionalDetailsSchema,
  catererPoliciesSchema,
  serviceLocationCatererSchema,
  eventTypesCateredSchema
};
