import mongoose from "mongoose";

const ReduxDjArtistSchema = new mongoose.Schema(
  {
    // Basic Service Information
    service_id: { type: String, unique: true },
    vendor_id: { type: String },
    service_type: { type: String, default: "DJ-Artist" },
    pageNumber: { type: Number, default: 1 },
    is_active: { type: Boolean, default: true },
    profile_completion_score: { type: Number, default: 0 },
    service_areas: { type: [String] },

    // Basic Details (flattened from basic_details)
    service_name: { type: String },
    point_of_contact: { type: String },
    service_contact_number: { type: String },
    description: { type: String },

    // Service Location (flattened from service_location_dj_artist)
    service_address: { type: String },
    service_lat: { type: String },
    service_lon: { type: String },
    service_pincode: { type: Number },
    google_map_link: { type: String },

    // Service Details (flattened from service_details)
    event_types_dj: { type: [String] },
    music_genres: { type: [String] },
    regional_specializations: { type: [String] },
    services_offered: { type: [String] },

    // Additional Details (flattened from additional_details)
    asset_images: { type: [String] },
    asset_videos: { type: [String] },
    ig_socials_link: { type: String },
    web_social_link: { type: String },
    prices_starts_from: { type: Number },

    // Policies (flattened from policies)
    terms_and_conditions: { type: [String] },
    cancellation_policy: { type: [String] },
    agreement_url: { type: String },
    agreement_signed_at: { type: Date },

    // Business Details (flattened from business_details)
    service_type_business: { type: String, default: "DJ-Artist" },
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

    // Timestamps
    dj_artist_created_at: { type: Date },
    dj_artist_updated_at: { type: Date },
  },
  { timestamps: true }
);

const DjArtistReduxModel =
  mongoose.models.ReduxDjArtist || mongoose.model("ReduxDjArtist", ReduxDjArtistSchema);

export { DjArtistReduxModel };
export default DjArtistReduxModel;