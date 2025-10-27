import mongoose, { Schema as _Schema, model } from "mongoose";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId2.js";
const Schema = _Schema;
// Service Location Schema for DJ Artist
const serviceLocationDjArtistSchema = new Schema({
  service_address: {
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
      validator: function (v) {
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
// DJ Artist Basic Details Schema
const djArtistBasicDetailsSchema = new Schema({
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
  description: {
    type: String,
    required: true
  },
  event_types_performed: [{
    type: String,
    required: true
  }],
  music_genres_specialized: [{
    type: String,
    required: true
  }],
  regional_specializations: [{
    type: String,
    required: true
  }],
  service_location_dj_artist: serviceLocationDjArtistSchema
}, { _id: false });
// DJ Artist Service Details Schema
const djArtistServiceDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  services_offered: [{
    type: String,
    required: true
  }],
  equipment_provided: [{
    type: String,
    required: true
  }],
  sound_system_specifications: {
    type: String
  },
  lighting_equipment_available: [{
    type: String
  }],
  is_mc_services_provided: {
    type: Boolean
  },
  is_karaoke_services_available: {
    type: Boolean
  },
  is_custom_playlist_creation: {
    type: Boolean
  },
  performance_duration_options: [{
    type: String,
    required: true
  }]
}, { _id: false });
// DJ Artist Additional Details Schema
const djArtistAdditionalDetailsSchema = new Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  asset_images: [{
    type: String,
    required: true
  }],
  asset_videos: [{
    type: String,
    required: true
  }],
  performance_samples: [{
    type: String
  }],
  min_booking_period: {
    type: Number,
    required: true
  },
  max_booking_period: {
    type: Number
  },
  prices_starts_from: {
    type: Number,
    required: true,
    min: 0
  },
  ig_socials_link: {
    type: String
  },
  web_social_link: {
    type: String
  },
  awards_achievements: {
    type: String
  },
  testimonials: [{
    type: String
  }]
}, { _id: false });
// DJ Artist Policies Schema
const djArtistPoliciesSchema = new Schema({
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
// Main DJ Artist Schema
const djArtistSchema = new Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("DJ")
  },
  vendor_id: {
    type: String,
    required: true,
    ref: 'Vendor'
  },
  service_type: {
    type: String,
    required: true,
    default: "DJ-Artist"
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
  // Embedded bank and business details using common schemas
  bank_details: {
    type: bankDetailsSchema,
    default: function () {
      return {};
    }
  },
  business_details: {
    type: businessDetailsSchema,
    required: true
  },
  basic_details: {
    type: djArtistBasicDetailsSchema,
    default: () => ({})
  },
  service_details: {
    type: djArtistServiceDetailsSchema,
    default: () => ({})
  },
  additional_details: {
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
djArtistSchema.pre('save', function (next) {
  // Declare now and istOffset once at the top of the function
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  // Set dj_artist_updated_at for all saves (new or existing)
  this.dj_artist_updated_at = istTime;
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
djArtistSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  // Declare now and istOffset once at the top of the function
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  this.set({ dj_artist_updated_at: istTime });
  // Update nested document timestamps if they are being updated
  const update = this.getUpdate();
  if (update.bank_details) {
    this.set({ 'bank_details.bank_updated_at': istTime });
  }
  if (update.business_details) {
    this.set({ 'business_details.business_updated_at': istTime });
  }
  next();
});
// Indexes for better performance
djArtistSchema.index({ vendor_id: 1 });
djArtistSchema.index({ is_active: 1 });
djArtistSchema.index({ service_areas: 1 });
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