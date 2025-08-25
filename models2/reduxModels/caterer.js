import mongoose from "mongoose";

const ReduxCatererSchema = new mongoose.Schema(
  {
    // Basic Service Information
    service_id: { type: String },
    vendor_id: { type: String },
    service_type: { type: String, default: "Caterer" },
    pageNumber: { type: Number, default: 1 },
    is_active: { type: Boolean, default: false },
    profile_completion_score: { type: Number, default: 0 },
    service_areas: { type: [String] },

    // Basic Details (flattened from basic_details)
    point_of_contact: { type: String },
    service_contact_number: { type: String },
    min_booking_capacity: { type: Number },
    max_booking_capacity: { type: Number },
    description: { type: String },
    cuisine_specialities: { type: [String] },
    regional_specialities: { type: [String] },
    service_style_offered: { type: [String] },

    // Service Location (flattened from service_location_caterer)
    service_address: { type: String },
    service_lat: { type: String },
    service_lon: { type: String },
    service_pincode: { type: Number },
    google_map_link: { type: String },

    // Event Details (flattened from event_details)
    event_types_catered: { type: [String] },
    additional_services_for_any_event: { type: [String] },
    staff_provided: { type: [String] },
    equipment_provided: { type: [String] },
    menu: { type: [String] },
    veg_or_nonveg: { type: String, enum: ['VEG', 'NON-VEG', 'BOTH'] },
    appetizers: { type: [String] },
    main_course: { type: [String] },
    beverages: { type: [String] },
    special_dietary_options: { type: [String] },
    pre_set_menus: { type: [String] },
    menu_customizable: { type: Boolean, default: false },

    // Additional Details (flattened from additional_details)
    min_booking_period: { type: Number },
    max_booking_period: { type: Number },
    asset_images: { type: [String] },
    asset_videos: { type: [String] },
    is_tasting_session_provided: { type: Boolean },
    is_business_license_available: { type: Boolean, default: false },
    food_safety_certificates: { type: [String] },
    prices_starts_from: { type: Number },

    // Business Details (flattened from business_details)
    service_type_business: { type: String, default: "Caterer" },
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
    caterer_created_at: { type: Date },
    caterer_updated_at: { type: Date }
  },
  { timestamps: true }
);

const ReduxCatererModel = mongoose.model("ReduxCaterer", ReduxCatererSchema);

export { ReduxCatererModel };
