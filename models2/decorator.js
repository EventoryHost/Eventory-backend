import mongoose from "mongoose";
import { bankDetailsSchema, businessDetailsSchema } from "./vendor.js";
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
    event_name: {
      type: String,
      required: true
    },
    event_type: {
      type: String,
      required: true
    }
  }],
  service_location_decorator: { // Changed to match ERD field name
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
      required: false
    },
    google_map_link: {
      type: String,
      required: false
    }
  }
}, { _id: false });

// Decorator Theme Details Schema
const decoratorThemeDetailsSchema = new mongoose.Schema({
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
    type: String,
    required: false
  },
  web_social_link: {
    type: String,
    required: false
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
    type: String,
    required: false
  },
  terms_and_conditions: {
    type: String,
    required: false
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
    required: false,
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
    type: decoratorThemeDetailsSchema,
    default: () => ({})
  },
  additional_details: {
    type: decoratorAdditionalDetailsSchema,
    default: () => ({})
  },
  policies: {
    type: decoratorPoliciesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  collection: 'decorators'
});

const Decorator = mongoose.model('Decorator', decoratorSchema);

export { 
  Decorator,
  decoratorBasicDetailsSchema,
  decoratorThemeDetailsSchema,
  decoratorAdditionalDetailsSchema,
  decoratorPoliciesSchema
};
