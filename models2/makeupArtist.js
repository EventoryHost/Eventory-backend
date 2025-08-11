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
    type: String,
    required: false
  },
  service_closing_time: {
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

// Event Types Makeup Schema
const eventTypesMakeupSchema = new Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    enum: ['common', 'wedding', 'corporate', 'seasonal'],
    required: true
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
    required: false
  },
  min_booking_capacity: {
    type: Number,
    required: false,
    min: 1
  },
  max_booking_capacity: {
    type: Number,
    required: false,
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
    required: false
  },
  is_customization_possible: {
    type: Boolean,
    required: false
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
    required: false
  },
  max_booking_period: {
    type: Number,
    required: false
  },
  prices_starts_from: {
    type: Number,
    required: false,
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
    default: "Makeup_Artist"
  },
  is_active: {
    type: Boolean,
    default: true
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
makeupArtistSchema.index({ profile_completition_score: -1 });

// Instance methods
makeupArtistSchema.methods.calculateProfileCompletion = function() {
  let score = 0;
  const sections = [
    'bank_details',
    'business_details', 
    'basic_details',
    'service_details',
    'additional_details', 
    'policies'
  ];
  
  const completedSections = sections.filter(section => {
    if (section === 'bank_details' || section === 'business_details') {
      // These are references to separate models, check if they exist and have data
      return this[section] && Object.keys(this[section]).length > 0;
    }
    return this[section] && this[section].is_completed;
  });
  
  this.profile_completition_score = Math.round((completedSections.length / sections.length) * 100);
  return this.profile_completition_score;
};

makeupArtistSchema.methods.updateRating = async function(newRating) {
  this.ratings = newRating;
  return this.save();
};

// Static methods
makeupArtistSchema.statics.findByVendorId = function(vendorId) {
  return this.find({ vendor_id: vendorId });
};

makeupArtistSchema.statics.findActiveServices = function() {
  return this.find({ is_active: true });
};

makeupArtistSchema.statics.findByServiceArea = function(area) {
  return this.find({ 
    service_areas: { $in: [area] },
    is_active: true 
  });
};

makeupArtistSchema.statics.findByRating = function(minRating = 1) {
  return this.find({ 
    ratings: { $gte: minRating },
    is_active: true 
  }).sort({ ratings: -1 });
};

makeupArtistSchema.statics.searchServices = function(filters = {}) {
  const query = { is_active: true };
  
  if (filters.vendor_id) query.vendor_id = filters.vendor_id;
  if (filters.service_areas?.length) query.service_areas = { $in: filters.service_areas };
  if (filters.min_rating) query.ratings = { $gte: filters.min_rating };
  if (filters.event_type) {
    query['basic_details.event_types_makeup.event_type'] = filters.event_type;
  }
  
    return this.find(query).sort({ ratings: -1, profile_completition_score: -1 });
};

// Pre-save middleware
makeupArtistSchema.pre('save', function(next) {
  // Auto-calculate profile completion percentage
  this.calculateProfileCompletion();
  
  // Ensure service_type is set correctly
  if (!this.service_type) {
    this.service_type = "Makeup_Artist";
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const MakeupArtist = mongoose.models.MakeupArtist || 
  model('MakeupArtist', makeupArtistSchema);

export default MakeupArtist;
