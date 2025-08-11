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

// Event Types Venue Schema
const eventTypesVenueSchema = new Schema({
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
    required: false
  },
  description: {
    type: String,
    required: true
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
    required: false
  },
  in_house_decoration: {
    type: Boolean,
    required: false
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
  facilities_at_venue: [{
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
    default: "Venue"
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
venueProviderSchema.index({ profile_completition_score: -1 });

// Instance methods
venueProviderSchema.methods.calculateProfileCompletion = function() {
  let score = 0;
  const sections = [
    'bank_details',
    'business_details',
    'basic_details',
    'feature_details', 
    'additional_details',
    'policies'
  ];
  
  sections.forEach(section => {
    if (section === 'bank_details' || section === 'business_details') {
      // Check if reference exists (these are references to separate models)
      if (this[section] && this[section] !== null) {
        score += 100 / sections.length;
      }
    } else if (this[section] && this[section].is_completed) {
      score += 100 / sections.length;
    }
  });
  
  this.profile_completition_score = Math.round(score);
  return this.profile_completition_score;
};

venueProviderSchema.methods.updateRating = async function(newRating) {
  this.ratings = newRating;
  return this.save();
};

venueProviderSchema.methods.hasInHouseCatering = function() {
  return this.feature_details?.in_house_catering === true;
};

venueProviderSchema.methods.hasInHouseDecoration = function() {
  return this.feature_details?.in_house_decoration === true;
};

// Static methods
venueProviderSchema.statics.findByVendorId = function(vendorId) {
  return this.find({ vendor_id: vendorId });
};

venueProviderSchema.statics.findActiveServices = function() {
  return this.find({ is_active: true });
};

venueProviderSchema.statics.findByServiceArea = function(area) {
  return this.find({ 
    service_areas: { $in: [area] },
    is_active: true 
  });
};

venueProviderSchema.statics.findByRating = function(minRating = 1) {
  return this.find({ 
    ratings: { $gte: minRating },
    is_active: true 
  }).sort({ ratings: -1 });
};

venueProviderSchema.statics.findByCapacity = function(minCapacity, maxCapacity) {
  const query = { is_active: true };
  
  if (minCapacity) {
    query['basic_details.min_booking_capacity'] = { $lte: minCapacity };
  }
  if (maxCapacity) {
    query['basic_details.max_booking_capacity'] = { $gte: maxCapacity };
  }
  
  return this.find(query).sort({ ratings: -1 });
};

venueProviderSchema.statics.searchServices = function(filters = {}) {
  const query = { is_active: true };
  
  if (filters.vendor_id) query.vendor_id = filters.vendor_id;
  if (filters.service_areas?.length) query.service_areas = { $in: filters.service_areas };
  if (filters.min_rating) query.ratings = { $gte: filters.min_rating };
  if (filters.event_type) {
    query['basic_details.event_types_venue.event_type'] = filters.event_type;
  }
  if (filters.venue_type) {
    query['feature_details.venue_types_available'] = { $in: [filters.venue_type] };
  }
  if (filters.in_house_catering !== undefined) {
    query['feature_details.in_house_catering'] = filters.in_house_catering;
  }
  if (filters.in_house_decoration !== undefined) {
    query['feature_details.in_house_decoration'] = filters.in_house_decoration;
  }
  
  return this.find(query).sort({ ratings: -1, profile_completition_score: -1 });
};

// Pre-save middleware
venueProviderSchema.pre('save', function(next) {
  // Auto-calculate profile completion percentage
  this.calculateProfileCompletion();
  
  // Ensure service_type is set correctly
  if (!this.service_type) {
    this.service_type = "Venue";
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const VenueProvider = mongoose.models.VenueProvider || 
  model('VenueProvider', venueProviderSchema);

export default VenueProvider;
