import mongoose from "mongoose";

const CateringSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    cateringName: { type: String },
    businessName: { type: String },
    servingCapacity: { type: String },

    // New fields based on the final model
    regionalSpecialties: { type: [String] }, // Renamed to match final model
    cuisineSpecialties: { type: [String] }, // Renamed to match final model
    serviceStyles: { type: [String] }, // Renamed to match final model

    // Additional fields
    venId: { type: String }, // Vendor ID
    capacity: { type: String }, // General capacity description
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
    foodSafety: { type: Boolean }, // Food safety certificates held

    // Optionally you could add more specific fields related to your use case
  },
  { timestamps: true },
); // Optional: include timestamps for createdAt and updatedAt fields

const CateringModel = mongoose.model("ReduxCatering", CateringSchema);

export { CateringModel };
