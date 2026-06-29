import mongoose, { Schema as _Schema, model } from "mongoose";
import { bankDetailsSchema } from "./bankDetails.js";
import { businessDetailsSchema } from "./businessDetails.js";
import generateUniqueId from "../utils/generateId.js";

const Schema = _Schema;

// Service Location Schema for PAV
const serviceLocationPAVSchema = new Schema(
  {
    service_address: {
      type: String,
    },
    lat: {
      type: String,
    },
    lon: {
      type: String,
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
  { _id: false },
);

// PAV Basic Details Schema
const pavBasicDetailsSchema = new Schema(
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
    event_types_captured: [
      {
        type: String,
        required: true,
      },
    ],
    send_proposals_to_clients: {
      type: Boolean,
      required: true, // Changed to required to match ERD
    },
    do_initial_customer_consultation: {
      type: Boolean,
    },
    do_destination_events: {
      type: Boolean,
    },
    do_advance_setup: {
      type: Boolean,
    },
    do_post_production_services: {
      type: Boolean,
    },
    service_location_pav: serviceLocationPAVSchema,
  },
  { _id: false },
);

// PAV Service Details Schema (keeping for structure consistency)
const pavServiceDetailsSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    type_of_service: {
      type: String,
      enum: ["photography", "videography", "both"],
      required: true,
    },
    types_of_equipment_available: [
      {
        type: String,
        required: true,
      },
    ],
    types_of_styles_offered: [
      {
        type: String,
        required: true,
      },
    ],
    add_ons_upgrade_available: [
      {
        type: String,
      },
    ],
    final_delivery_methods: [
      {
        type: String,
        required: true,
      },
    ],
    service_offering_type: {
      type: String,
      enum: ["Customize", "Standard", "Both"],
      required: true, // Changed to required to match ERD
    },
    delivery_timeline: {
      type: String,
      required: true, // Changed to required to match ERD
    },
  },
  { _id: false },
);

// PAV Additional Details Schema
const pavAdditionalDetailsSchema = new Schema(
  {
    is_completed: {
      type: Boolean,
      default: false,
    },
    asset_images: [
      {
        original: { type: String },
        preview: { type: String },
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
  { _id: false },
);

// Policies Schema for photographer videographers
const policiesSchema = new Schema(
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
      required: true,
    },
    agreement_signed_at: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

// Main Photographer and Videographer Schema
const photographerVideographerSchema = new Schema(
  {
    service_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUniqueId("PAV"),
    },
    vendor_id: {
      type: String,
      required: true,
    },
    service_type: {
      type: String,
      required: true,
      default: "Photographer-Videographer", // Changed to match ERD exactly
    },
    is_active: {
      type: Boolean,
      default: true, // Changed to true to match ERD default
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
      type: pavBasicDetailsSchema,
      default: () => ({}),
    },
    service_details: {
      type: pavServiceDetailsSchema,
      default: () => ({}),
    },
    additional_details: {
      type: pavAdditionalDetailsSchema,
      default: () => ({}),
    },
    policies: {
      type: policiesSchema,
      default: () => ({}),
    },
    pav_created_at: {
      type: Date,
      default: () => {
        // Convert to IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + istOffset);
      },
    },
    pav_updated_at: {
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
    collection: "photographer-videographers",
  },
);
// Pre-save middleware to update pav_updated_at on every save
photographerVideographerSchema.pre("save", function (next) {
  // Declare variables at the top to make them accessible to the entire function
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  if (!this.isNew) {
    this.pav_updated_at = istTime;
  }

  // Update nested document timestamps if they exist and are modified
  if (this.isModified("bank_details") && this.bank_details) {
    this.bank_details.bank_updated_at = istTime;
  }

  if (this.isModified("business_details") && this.business_details) {
    this.business_details.business_updated_at = istTime;
  }

  next();
});

// Pre-update middleware to update pav_updated_at on updates
// This function is already correct and doesn't need to be changed.
photographerVideographerSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    this.set({ pav_updated_at: istTime });

    // Update nested document timestamps if they are being updated
    const update = this.getUpdate();

    if (update.bank_details || update["bank_details"]) {
      this.set({ "bank_details.bank_updated_at": istTime });
    }

    if (update.business_details || update["business_details"]) {
      this.set({ "business_details.business_updated_at": istTime });
    }

    next();
  },
);

// Indexes for better performance
photographerVideographerSchema.index({ vendor_id: 1 });
photographerVideographerSchema.index({ service_areas: 1 });
photographerVideographerSchema.index({ is_active: 1 });
photographerVideographerSchema.index({ ratings: -1 });
photographerVideographerSchema.index({ profile_completion_score: -1 }); // Fixed field name in index
photographerVideographerSchema.index({ pav_created_at: -1 });
photographerVideographerSchema.index({ pav_updated_at: -1 });
// Removed duplicate service_id index - it's already created by unique: true constraint

// Check if model already exists to prevent OverwriteModelError
const PhotographerVideographer =
  mongoose.models.PhotographerVideographer ||
  model("PhotographerVideographer", photographerVideographerSchema);

export default PhotographerVideographer;

export {
  PhotographerVideographer,
  pavBasicDetailsSchema,
  pavServiceDetailsSchema,
  pavAdditionalDetailsSchema,
  serviceLocationPAVSchema,
};
