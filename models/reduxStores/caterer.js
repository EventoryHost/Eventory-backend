import mongoose from "mongoose";

const CateringSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    pageNumber: { type: String, default: "1" },
    cateringName: { type: String },
    businessName: { type: String },
    servingCapacity: { type: String },
    description: { type: String },
    venueType: { type: String, default: "catering" },
    priceStarts:{ type: String },

    // New fields based on the final model
    regionalSpecialties: { type: [String] }, // Renamed to match final model
    cuisineSpecialties: { type: [String] }, // Renamed to match final model
    serviceStyles: { type: [String] }, // Renamed to match final model

    // Additional fields
    venId: { type: String },
    capacity: { type: String }, // General capacity
    veg: { type: [String] },
    menu: { type: [String] }, // Menu items (you might need to adjust this)
    vegOrNonVeg: { type: String }, // Whether the catering is veg or non-veg

    // Selected items
    selectedAppetizers: { type: [String] },
    selectedBeverages: { type: [String] },
    selectedMainCourses: { type: [String] },
    selectedDietaryOptions: { type: [String] },

    preSetMenu: { type: String }, // Can be adjusted based on requirements
    customizableMenu: { type: Boolean }, // Is the menu customizable?

    // Additional fields based on your final model
    cancellationPolicy: { type: String }, // Cancellation policy
    termsAndConditions: { type: String }, // Terms and conditions
    clientTestimonials: { type: String }, // Testimonials from clients

    eventTypes: { type: [String] }, // Event types catered by the service
    additionalServices: { type: [String] }, // Additional services provided

    staffProvides: { type: [String] }, // Staff provided by the catering service
    equipmentsProvided: { type: [String] }, // Equipment provided by the catering service

    minOrderReq: { type: String }, // Minimum order requirements
    AdvBooking: { type: String }, // Advance booking period
    photos: { type: [String] }, // Photos related to catering
    videos: { type: [String] }, // Videos related to catering
    tastingSessions: { type: Boolean }, // Tasting sessions offered
    businessLicenses: { type: Boolean }, // Business licenses held
    food_safety_certificates: { type: [String], required: true },

    // Optionally you could add more specific fields related to your use case
  },
  { timestamps: true },
); // Optional: include timestamps for createdAt and updatedAt fields

const CateringModel = mongoose.model("ReduxCatering", CateringSchema);

export { CateringModel };
