import mongoose from "mongoose";

const ReduxPhotographerVideographerSchema = new mongoose.Schema(
  {
    // Basic Service Information
    service_id: { type: String, unique: true },
    vendor_id: { type: String },
    service_type: { type: String, default: "Photographer-Videographer" },
    pageNumber: { type: Number, default: 1 },
    is_active: { type: Boolean, default: true },
    profile_completion_score: { type: Number, default: 0 },
    service_areas: { type: [String] },

    // Basic Details (flattened from basic_details)
    point_of_contact: { type: String },
    service_contact_number: { type: String },
    description: { type: String },
    min_booking_capacity: { type: Number },
    max_booking_capacity: { type: Number },
    event_types_captured: { type: [String] },
    send_proposals_to_clients: { type: Boolean },
    do_initial_customer_consultation: { type: Boolean },
    do_destination_events: { type: Boolean },
    do_advance_setup: { type: Boolean },
    do_post_production_services: { type: Boolean },

    // Service Location (flattened from service_location_pav)
    service_lat: { type: String },
    service_lon: { type: String },
    service_pincode: { type: Number },
    google_map_link: { type: String },

    // Service Details (flattened from service_details)
    type_of_service: { type: String, enum: ["photography", "videography", "both"] },
    types_of_equipment_available: { type: [String] },
    types_of_styles_offered: { type: [String] },
    add_ons_upgrade_available: { type: [String] },
    final_delivery_methods: { type: [String] },
    service_offering_type: { type: String, enum: ['Customize', 'Standard', 'Both'] },
    delivery_timeline: { type: String },

    // Additional Details (flattened from additional_details)
    asset_images: { type: [String] },
    asset_videos: { type: [String] },
    min_booking_period: { type: Number },
    max_booking_period: { type: Number },
    prices_starts_from: { type: Number },
    ig_socials_link: { type: String },
    web_social_link: { type: String },

    // Business Details (flattened from business_details)
    service_type_business: { type: String, default: "Photographer-Videographer" },
    category: { type: Number },
    business_registration_name: { type: String },
    gst: { type: String },
    pan: { type: String },
    verification_type: { type: String, enum: ['GSTIN', 'PAN'] },
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
    cancellation_policy: { type: String },
    terms_and_conditions: { type: String },
    agreement_url: { type: String },
    agreement_signed_at: { type: Date },

    // Timestamps
    pav_created_at: { type: Date },
    pav_updated_at: { type: Date }
  },
  { timestamps: true }
);

const ReduxPhotographerVideographerModel = mongoose.model("ReduxPhotographerVideographer", ReduxPhotographerVideographerSchema);

export { ReduxPhotographerVideographerModel };
