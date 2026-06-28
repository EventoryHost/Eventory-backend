import mongoose from "mongoose";

const ReduxMakeupArtistSchema = new mongoose.Schema(
  {
    // Basic Service Information
    service_id: { type: String },
    vendor_id: { type: String },
    service_type: { type: String, default: "Makeup-Artist" },
    pageNumber: { type: Number, default: 1 },
    is_active: { type: Boolean, default: true },
    profile_completion_score: { type: Number, default: 0 },
    service_areas: { type: [String] },

    // Basic Details (flattened from basic_details)
    point_of_contact: { type: String },
    service_contact_number: { type: String },
    min_booking_capacity: { type: Number },
    max_booking_capacity: { type: Number },
    description: { type: String },
    event_types_makeup: { type: [String] },
    types_of_makeup_artists_available: { type: [String] },

    // Service Location (flattened from service_location_make_up)
    service_address: { type: String },
    service_lat: { type: String },
    service_lon: { type: String },
    service_opening_time: { type: String },
    service_closing_time: { type: String },
    service_pincode: { type: Number },
    google_map_link: { type: String },

    // Service Details (flattened from service_details)
    is_onsite_makeup_available: { type: Boolean },
    is_customization_possible: { type: Boolean },
    service_types: { type: [String] },

    // Additional Details (flattened from additional_details)
    asset_images: [
      {
        original: { type: String },
        preview: { type: String },
      },
    ],
    asset_videos: { type: [String] },
    min_booking_period: { type: Number },
    max_booking_period: { type: Number },
    prices_starts_from: { type: Number },
    ig_socials_link: { type: String },
    web_social_link: { type: String },

    // Business Details (flattened from business_details)
    service_type_business: { type: String, default: "Makeup-Artist" },
    category: { type: Number },
    business_registration_name: { type: String },
    gst: { type: String },
    pan: { type: String },
    verification_type: { type: String, enum: ["GSTIN", "PAN"] },
    team_size: { type: Number },
    years_of_operation: { type: Number },
    business_address: { type: String },
    landmark: { type: String },
    pincode: { type: Number },
    operational_cities: { type: [String] },
    annual_revenue: { type: String },
    annual_bookings: { type: Number },
    business_created_at: { type: Date },
    business_updated_at: { type: Date },

    // Bank Details (flattened from bank_details)
    bank_vendor_id: { type: String },
    bank_service_id: { type: String },
    bank_name: { type: String },
    account_type: { type: String },
    account_number: { type: String },
    ifsc: { type: String },
    bank_created_at: { type: Date },
    bank_updated_at: { type: Date },

    // Policies (flattened from policies)
    policies_is_completed: { type: Boolean, default: false },
    cancellation_policy: { type: String },
    terms_and_conditions: { type: String },
    agreement_url: { type: String },
    agreement_signed_at: { type: Date },

    // Timestamps
    makeup_artist_created_at: { type: Date },
    makeup_artist_updated_at: { type: Date },
  },
  { timestamps: true },
);

const MakeupArtistModel =
  mongoose.models.ReduxMakeupArtists ||
  mongoose.model("ReduxMakeupArtists", ReduxMakeupArtistSchema);

export { MakeupArtistModel };
