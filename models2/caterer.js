import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId2.js";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";

const Schema = _Schema;

// Service Location Schema for Caterers
const serviceLocationCatererSchema = new Schema({
  lat: {
    type: String
  },
  lon: {
    type: String
  },
  service_pincode: {
    type: Number,
    validate: {
      validator: function(v) {
        if (v === undefined || v === null) return true;
        return /^\d{6}$/.test(String(v));
      },
      message: 'Service pincode must be a 6-digit number'
    }
  },
  google_map_link: {
    type: String
  }
}, { _id: false });

// Caterer Basic Details Schema
const catererBasicDetailsSchema = new Schema({
  is_completed: {
    type: Boolean
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
  service_location_caterer: serviceLocationCatererSchema
}, { _id: false });

// Caterer Menu Details Schema
const catererMenuDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  menu: [{
    type: String
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
  }],
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
    type: Number
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
    type: Number, // Integer for getting values of their min item value
    required: true // Added required to match ERD
  }
}, { _id: false });

// Caterer Policies Schema (separate for caterers)
const catererPoliciesSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  cancellation_policy: {
    type: String
  },
  terms_and_conditions: {
    type: String
  },
  agreement_url: {
    type: String,
    required: true
  },
  agreement_signed_at: {
    type: Date,
    required: true
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
    default: false
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
  additional_details: catererAdditionalDetailsSchema,
  policies: catererPoliciesSchema,
  caterer_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  caterer_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'caterers'
});

// Pre-save middleware to update caterer_updated_at on every save
catererSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.caterer_updated_at = new Date(now.getTime() + istOffset);
  }
  
  // Update nested document timestamps if they exist and are modified
  if (this.isModified('bank_details') && this.bank_details) {
    this.bank_details.bank_updated_at = new Date(now.getTime() + istOffset);
  }
  
  if (this.isModified('business_details') && this.business_details) {
    this.business_details.business_updated_at = new Date(now.getTime() + istOffset);
  }
  
  next();
});

// Pre-update middleware to update caterer_updated_at on updates
catererSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  this.set({ caterer_updated_at: istTime });
  
  // Update nested document timestamps if they are being updated
  const update = this.getUpdate();
  
  if (update.bank_details || update['bank_details']) {
    this.set({ 'bank_details.bank_updated_at': istTime });
  }
  
  if (update.business_details || update['business_details']) {
    this.set({ 'business_details.business_updated_at': istTime });
  }
  
  next();
});

// Indexes for better performance
catererSchema.index({ vendor_id: 1 });
catererSchema.index({ is_active: 1 });
catererSchema.index({ service_areas: 1 });
catererSchema.index({ caterer_created_at: -1 });
catererSchema.index({ caterer_updated_at: -1 });

const Caterer = model("Caterers", catererSchema);

export default Caterer;
export { 
  Caterer, 
  catererSchema,
  catererBasicDetailsSchema,
  catererMenuDetailsSchema,
  catererEventDetailsSchema,
  catererAdditionalDetailsSchema,
  catererPoliciesSchema,
  serviceLocationCatererSchema
};
