import mongoose, { Schema as _Schema, model } from "mongoose";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Service Location Schema for DJ Artist
const serviceLocationDjArtistSchema = new Schema({
  service_address:{
    type: String
  },
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

const djArtistBasicDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  serviceName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  serviceAreas: [{
    type: String,
    required: true
  }],
  service_location_dj_artist: serviceLocationDjArtistSchema
}, { _id: false });

const djArtistServiceDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  eventTypes: [{
    type: String,
    required: true
  }],
  musicGenres: [{
    type: String
  }],
  regionalSpecializations: [{
    type: String,
    required: true
  }],
  servicesOffered: [{
    type: String,
    required: true
  }]
}, { _id: false });

const djArtistAdditionalDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  photos: [{
    type: String,
    required: true
  }],
  videos: [{
    type: String,
    required: true
  }],
  awards: {
    type: String
  },
  instagramUrl: {
    type: String
  },
  websiteUrl: {
    type: String
  },
  testimonials: {
    type: String
  },
  priceStarts: {
    type: Number,
    required: true
  }
}, { _id: false });

const djArtistPoliciesSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  termsAndConditions: [{
    type: String
  }],
  cancellationPolicy: [{
    type: String
  }],
  agreementUrl: {
    type: String
  },
  agreementSignedAt: {
    type: Date
  }
}, { _id: false });

const djArtistSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("DJS")
  },
  vendor_id: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    default: "djArtist"
  },
  is_active: {
    type: Boolean,
    default: true
  },
  profile_completion_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  service_areas: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  // Embedded bank and business details using common schemas
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
  basicDetails: {
    type: djArtistBasicDetailsSchema,
    default: () => ({})
  },
  serviceDetails: {
    type: djArtistServiceDetailsSchema,
    default: () => ({})
  },
  additionalDetails: {
    type: djArtistAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: djArtistPoliciesSchema,
    default: () => ({})
  },
  dj_artist_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  dj_artist_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'dj-artists'
});

// Pre-save middleware to update dj_artist_updated_at on every save
djArtistSchema.pre('save', function(next) {
  // Declare variables at the top to make them accessible to the entire function
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  if (!this.isNew) {
    this.dj_artist_updated_at = istTime;
  }
  
  // Update nested document timestamps if they exist and are modified
  if (this.isModified('bank_details') && this.bank_details) {
    this.bank_details.bank_updated_at = istTime;
  }
  
  if (this.isModified('business_details') && this.business_details) {
    this.business_details.business_updated_at = istTime;
  }
  
  next();
});

// Pre-update middleware to update dj_artist_updated_at on updates
djArtistSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  this.set({ dj_artist_updated_at: istTime });
  
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
djArtistSchema.index({ vendor_id: 1 });
djArtistSchema.index({ service_areas: 1 });
djArtistSchema.index({ is_active: 1 });
djArtistSchema.index({ isVerified: 1 });
djArtistSchema.index({ profile_completion_score: -1 });
djArtistSchema.index({ dj_artist_created_at: -1 });
djArtistSchema.index({ dj_artist_updated_at: -1 });

// Check if model already exists to prevent OverwriteModelError
const DjArtist = mongoose.models.DjArtist || 
  model('DjArtist', djArtistSchema);

export default DjArtist;

export {
  DjArtist,
  djArtistBasicDetailsSchema,
  djArtistServiceDetailsSchema,
  djArtistAdditionalDetailsSchema,
  djArtistPoliciesSchema,
  serviceLocationDjArtistSchema
};