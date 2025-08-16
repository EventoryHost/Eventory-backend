import mongoose, { Schema as _Schema, model } from "mongoose";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId2.js";

const Schema = _Schema;

// Service Location Schema for Venue Provider
const serviceLocationVenueSchema = new Schema(
  {
    lat: {
      type: String,
    },
    lon: {
      type: String,
    },
    service_opening_time: {
      type: String, // Kept as String to match ERD format "hh:mm"
    },
    service_closing_time: {
      type: String, // Kept as String to match ERD format "hh:mm"
    },
    service_pincode: {
      type: Number,
      validate: {
        validator: function (v) {
          if (v === undefined || v === null) return true;
          return /^\d{6}$/.test(String(v));
        },
        message: "Service pincode must be a 6-digit number",
      },
    },
    google_map_link: {
      type: String,
    },
  },
  { _id: false }
);

// Venue Provider Basic Details Schema
const venueBasicDetailsSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    point_of_contact: {
      type: String,
      required: true,
    },
    service_contact_number: {
      type: String,
      required: true, // Changed to required to match ERD
    },
    description: {
      type: String,
      required: true,
    },
    min_booking_capacity: {
      type: Number,
      required: true, // Changed to required to match ERD
      min: 1,
    },
    max_booking_capacity: {
      type: Number,
      required: true, // Changed to required to match ERD
      min: 1,
    },
    venue_name: {
      type: String,
      required: true,
    },
    service_type_details: [
      {
        // Added to match ERD field name
        type: String,
        required: true,
      },
    ],
    event_types_venue: [
      {
        type: String,
        required: true,
      },
    ],
    service_location_venue: serviceLocationVenueSchema,
  },
  { _id: false }
);

// Venue Provider Feature Details Schema
const venueServiceDetailsSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    in_house_catering: {
      type: Boolean,
      required: true, // Changed to required to match ERD
    },
    in_house_decoration: {
      // Fixed typo to match ERD exactly
      type: Boolean,
      required: true, // Changed to required to match ERD
    },
    venue_types_available: [
      {
        type: String,
        required: true,
      },
    ],
    av_eqp_available_at_venue: [
      {
        type: String,
      },
    ],
    accessibility_features_of_venue: [
      {
        type: String,
      },
    ],
    restriction_policies_on_venue: [
      {
        type: String,
      },
    ],
    special_features_in_venue: [
      {
        type: String,
      },
    ],
    fascilities_at_venue: [
      {
        // Fixed typo to match ERD exactly
        type: String,
      },
    ],
  },
  { _id: false }
);

// Venue Provider Additional Details Schema
const venueAdditionalDetailsSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    asset_images: [
      {
        type: String,
      },
    ],
    asset_videos: [
      {
        type: String,
      },
    ],
    min_booking_period: {
      type: Number,
      required: true, // Changed to required to match ERD
    },
    max_booking_period: {
      type: Number,
      required: true, // Changed to required to match ERD
    },
    prices_starts_from: {
      type: Number,
      required: true, // Changed to required to match ERD
      min: 0,
    },
    ig_socials_link: {
      type: String,
    },
    web_social_link: {
      type: String,
    },
  },
  { _id: false }
);

// Venue Provider Policies Schema (separate for venue providers)
const venuePoliciesSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    cancellation_policy: {
      type: String,
    },
    terms_and_conditions: {
      type: String,
    },
    agreement_url: {
      type: String,
    },
    agreement_signed_at: {
      type: Date,
    },
  },
  { _id: false }
);

// Main Venue Provider Schema
const venueProviderSchema = new Schema(
  {
    service_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUniqueId("VNP"),
    },
    vendor_id: {
      type: String,
      required: true,
    },
    service_type: {
      type: String,
      required: true,
      default: "Venue-Provider", // Changed to match ERD exactly
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    profile_completion_score: {
      // Fixed typo: "completition" → "completion"
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    service_areas: [
      {
        type: String,
      },
    ],
    // Embedded bank and business details using common schemas
    bank_details: {
      type: bankDetailsSchema,
      default: function () {
        return {};
      },
    },
    business_details: {
      type: businessDetailsSchema,
      required: true,
    },
    basic_details: {
      type: venueBasicDetailsSchema,
      default: () => ({}),
    },
    feature_details: {
      type: venueServiceDetailsSchema,
      default: () => ({}),
    },
    additional_details: {
      type: venueAdditionalDetailsSchema,
      default: () => ({}),
    },
    policies: {
      type: venuePoliciesSchema,
      default: () => ({}),
    },
    venue_provider_created_at: {
      type: Date,
      default: () => {
        // Convert to IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + istOffset);
      },
    },
    venue_provider_updated_at: {
      type: Date,
      default: () => {
        // Convert to IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + istOffset);
      },
    },
  },
  {
    collection: "venue-providers",
  }
);

// Pre-save middleware to update venue_provider_updated_at on every save
venueProviderSchema.pre("save", function (next) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    this.venue_provider_updated_at = new Date(now.getTime() + istOffset);
  } // Update nested document timestamps if they exist and are modified
  if (this.isModified("bank_details") && this.bank_details) {
    this.bank_details.bank_updated_at = new Date(now.getTime() + istOffset);
  }
  if (this.isModified("business_details") && this.business_details) {
    this.business_details.business_updated_at = new Date(
      now.getTime() + istOffset
    );
  }
  next();
});

// Pre-update middleware to update venue_provider_updated_at on updates
venueProviderSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    this.set({ venue_provider_updated_at: istTime }); // Update nested document timestamps if they are being updated
    const update = this.getUpdate();
    if (update.bank_details || update["bank_details"]) {
      this.set({ "bank_details.bank_updated_at": istTime });
    }
    if (update.business_details || update["business_details"]) {
      this.set({ "business_details.business_updated_at": istTime });
    }
    next();
  }
);

// Indexes for better performance
venueProviderSchema.index({ vendor_id: 1 });
venueProviderSchema.index({ service_areas: 1 });
venueProviderSchema.index({ is_active: 1 });
venueProviderSchema.index({ ratings: -1 });
venueProviderSchema.index({ profile_completion_score: -1 });

const VenueProvider = model("VenueProvider", venueProviderSchema);

export default VenueProvider;
