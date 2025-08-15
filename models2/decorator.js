import mongoose from "mongoose";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId2.js";

// Decorator Basic Details Schema
const decoratorBasicDetailsSchema = new mongoose.Schema({
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
  avg_setup_duration: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  event_types_decorated: [{
    type: String,
    required: true
  }],
  service_location_decorator: { // Changed to match ERD field name
    lat: {
      type: String,
    },
    lon: {
      type: String
    },
    service_pincode: {
      type: Number
    },
    google_map_link: {
      type: String
    }
  }
}, { _id: false });

// Decorator Theme Details Schema
const decoratorServiceDetailsSchema = new mongoose.Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  themes_offered: {
    type: [String],
    required: true
  },
  is_prop_selection_available: {
    type: Boolean
  },
  any_custom_design_process: {
    type: String
  },
  is_colour_scheme_assistance_provided: {
    type: Boolean
  },
  is_theme_customization_allowed: {
    type: Boolean
  },
  is_venue_adaptability: {
    type: Boolean
  },
  theme_elements_available: {
    type: [String]
  },
  theme_portfolio_images: {
    type: [String]
  },
  theme_portfolio_videos: {
    type: [String]
  }
}, { _id: false });

// Decorator Additional Details Schema
const decoratorAdditionalDetailsSchema = new mongoose.Schema({
  is_completed: {
    type: Boolean,
    default: false
  },
  asset_images: {
    type: [String],
    required: true
  },
  asset_videos: {
    type: [String],
    required: true
  },
  min_booking_period: {
    type: Number,
    required: true
  },
  max_booking_period: {
    type: Number
  },
  prices_starts_from: {
    type: Number,
    required: true
  },
  ig_socials_link: {
    type: String
  },
  web_social_link: {
    type: String
  },
  is_theme_proposals_provided: {
    type: Boolean
  },
  is_proposal_revision_possible: {
    type: Boolean
  }
}, { _id: false });

// Decorator Policies Schema (separate for decorators)
const decoratorPoliciesSchema = new mongoose.Schema({
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

// Main Decorator Schema
const decoratorSchema = new mongoose.Schema({
  service_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("DECO")
  },
  vendor_id: {
    type: String,
    required: true,
    ref: 'Vendor'
  },
  service_type: {
    type: String,
    default: "Decorator",
    immutable: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  profile_completion_score: { // Corrected typo: "completition" → "completion"
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  service_areas: {
    type: [String],
    default: []
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
  // Embedded schemas
  basic_details: {
    type: decoratorBasicDetailsSchema,
    default: () => ({})
  },
  theme_details: {
    type: decoratorServiceDetailsSchema,
    default: () => ({})
  },
  additional_details: {
    type: decoratorAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: decoratorPoliciesSchema,
    default: () => ({})
  },
  decorator_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  decorator_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'decorators'
});

// Pre-save middleware to update decorator_updated_at on every save
decoratorSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.decorator_updated_at = new Date(now.getTime() + istOffset);
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

// Pre-update middleware to update decorator_updated_at on updates
decoratorSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  this.set({ decorator_updated_at: istTime });
  
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
decoratorSchema.index({ vendor_id: 1 });
decoratorSchema.index({ is_active: 1 });
decoratorSchema.index({ service_areas: 1 });
decoratorSchema.index({ decorator_created_at: -1 });
decoratorSchema.index({ decorator_updated_at: -1 });
decoratorSchema.index({ service_id: 1 });

const Decorator = mongoose.model('Decorators', decoratorSchema);

export { 
  Decorator,
  decoratorBasicDetailsSchema,
  decoratorServiceDetailsSchema,
  decoratorAdditionalDetailsSchema,
  decoratorPoliciesSchema
};
