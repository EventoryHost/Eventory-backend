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

// PAV Service Types Details Schema
const pavServiceTypesDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
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
    required: false,
    default: ""
  },
  description: {
    type: String,
    required: true
  },
  min_booking_capacity: {
    type: Number,
    required: false,
    min: 1,
    default: 1
  },
  max_booking_capacity: {
    type: Number,
    required: false,
    min: 1,
    default: 100
  },
  event_types_captured: [{
    event_name: {
      type: String,
      required: true
    },
    event_type: {
      type: String,
      enum: ['common', 'wedding', 'corporate', 'seasonal'],
      required: true
    }
  }],
  service_location_pav: serviceLocationPAVSchema
}, { _id: false });

// PAV Service Details Schema
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
  min_booking_period: {
    type: Number,
    required: false,
    default: 1
  },
  max_booking_period: {
    type: Number,
    required: false,
    default: 365
  },
  asset_images: [{
    type: String
  }],
  asset_videos: [{
    type: String
  }],
  ig_socials_link: {
    type: String,
    required: false
  },
  web_social_link: {
    type: String,
    required: false
  },
  prices_starts_from: {
    type: Number,
    required: false,
    min: 0
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
    required: false
  },
  send_proposals_to_clients: {
    type: Boolean,
    required: false
  },
  do_initial_customer_consultation: {
    type: Boolean,
    required: false
  },
  do_destination_events: {
    type: Boolean,
    required: false
  },
  do_advance_setup: {
    type: Boolean,
    required: false
  },
  do_post_production_services: {
    type: Boolean,
    required: false
  },
  delivery_timeline: {
    type: String,
    required: false
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
    default: "Photographer"
  },
  is_active: {
    type: Boolean,
    default: false
  },
  profile_completition_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  service_areas: [{
    type: String,
    default: []
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
  additional_details: {
    type: pavAdditionalDetailsSchema,
    default: () => ({})
  },
  consultation_services: {
    type: pavConsultationsDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: policiesSchema,
    default: () => ({})
  },
}, {
  timestamps: true,
  collection: 'photographer-videographers'
});

// Indexes for better performance
photographerVideographerSchema.index({ vendor_id: 1 });
photographerVideographerSchema.index({ service_areas: 1 });
photographerVideographerSchema.index({ is_active: 1 });
photographerVideographerSchema.index({ ratings: -1 });
photographerVideographerSchema.index({ profile_completition_score: -1 });

// Instance methods
photographerVideographerSchema.methods.calculateProfileCompletion = function() {
  let score = 0;
  const sections = [
    'bank_details',
    'business_details',
    'basic_details',
    'service_details', 
    'consultation_services',
    'policies'
  ];
  
  const completedSections = sections.filter(section => {
    if (section === 'bank_details' || section === 'business_details') {
      // Check if reference exists (these are references to separate models)
      return this[section] && this[section] !== null;
    }
    return this[section] && this[section].is_completed;
  });
  
  this.profile_completition_score = Math.round((completedSections.length / sections.length) * 100);
  return this.profile_completition_score;
};

photographerVideographerSchema.methods.updateRating = async function(newRating) {
  this.ratings = newRating;
  return this.save();
};

photographerVideographerSchema.methods.hasPhotographyService = function() {
  return this.service_details?.service_type_details?.some(service => 
    service.type_of_service === 'photography'
  );
};

photographerVideographerSchema.methods.hasVideographyService = function() {
  return this.service_details?.service_type_details?.some(service => 
    service.type_of_service === 'videography'
  );
};

// Static methods
photographerVideographerSchema.statics.findByVendorId = function(vendorId) {
  return this.find({ vendor_id: vendorId });
};

photographerVideographerSchema.statics.findActiveServices = function() {
  return this.find({ is_active: true });
};

photographerVideographerSchema.statics.findByServiceArea = function(area) {
  return this.find({ 
    service_areas: { $in: [area] },
    is_active: true 
  });
};

photographerVideographerSchema.statics.findByRating = function(minRating = 1) {
  return this.find({ 
    ratings: { $gte: minRating },
    is_active: true 
  }).sort({ ratings: -1 });
};

photographerVideographerSchema.statics.searchServices = function(filters = {}) {
  const query = { is_active: true };
  
  if (filters.vendor_id) query.vendor_id = filters.vendor_id;
  if (filters.service_areas?.length) query.service_areas = { $in: filters.service_areas };
  if (filters.min_rating) query.ratings = { $gte: filters.min_rating };
  if (filters.event_type) {
    query['basic_details.event_types_captured.event_type'] = filters.event_type;
  }
  
  return this.find(query).sort({ ratings: -1, profile_completition_score: -1 });
};

// Pre-save middleware
photographerVideographerSchema.pre('save', function(next) {
  // Auto-calculate profile completion score
  this.calculateProfileCompletion();
  
  // Ensure service_type is set correctly
  if (!this.service_type) {
    this.service_type = "Photographer";
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const PhotographerVideographer = mongoose.models.PhotographerVideographer || 
  model('PhotographerVideographer', photographerVideographerSchema);

export default PhotographerVideographer;
