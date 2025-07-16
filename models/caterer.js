import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";

const Schema = _Schema;

const catererSchema = new Schema({
  type: { type: String, default: "caterer" },
  isVerified: { type: Boolean, default: false },
  basicDetails: {
    profileCompletion: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    capacity: {
      ll: { type: Number, required: true },
      ul: { type: Number, required: true },
    },
    description: { type: String, required: true },
    cuisine_specialities: { type: [String], required: true },
    serviceAreas: { type: [String], required: true },
    regional_specialities: { type: [String], required: true },
    service_style_offered: { type: [String], required: true },
    location: {
      lat: { type: Number }, // Latitude
      lng: { type: Number }, // Longitude
      pincode: {
        type: Number,
        required: false, // Make pincode explicitly optional
        validate: {
          validator: function (v) {
            // Skip validation if value is undefined, null, or zero
            if (v === undefined || v === null || v === 0) return true;
            // Ensure it's a 6-digit number
            return /^\d{6}$/.test(String(v));
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode!`,
        },
      },
      googleMapsAddress: { type: String }, // Google Maps formatted address
    },
  },
  menuDetails: {
    completed: { type: Boolean, default: false },
    menu: { type: [String], required: true },
    vegOrNonVeg: {
      type: String,
      enum: ["veg", "nonVeg", "both"],
      required: true,
    },
    appetizers: [String],
    main_course: [String],
    beverages: [String],
    special_dietary_options: [String],
    pre_set_menus: [String],
    customizable: { type: Boolean },
  },
  eventDetails: {
    completed: { type: Boolean, default: false },
    event_types_catered: { type: [String], required: true },
    additional_services: [String],
  },
  staffAndEquipmentDetails: {
    completed: { type: Boolean, default: false },
    staff_provided: { type: [String], required: true },
    equipment_provided: [String],
  },
  additionalDetails: {
    completed: { type: Boolean, default: false },
    minimum_order_requirements: { type: String, required: true },
    advance_booking_period: {
      ll: { type: Number, required: true },
      ul: { type: Number, required: true },
    },
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    tasting_sessions: { type: Boolean, required: true },
    business_licenses: { type: Boolean, required: false },
    food_safety_certificates: { type: [String], required: true },
    priceStartingFrom: { type: Number, required: true },
  },
  policies: {
    completed: { type: Boolean, default: false },
    cancellationPolicy: { type: String },
    termsAndConditions: { type: String },
    client_testimonials: { type: String },
    agreementUrl: { type: String },
    agreementSignedAt: { type: Date },
  },
  id: {
    type: String,
    default: () => generateUniqueId("cat"),
    required: true,
    unique: true,
  },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "caterer" },
  schedule: [eventSchema],
  rating: { type: Number, default: 0, min: 0, max: 5 }, // Aggregate rating of all reviews
});

const Caterer = model("Caterer", catererSchema);

export { Caterer, catererSchema };
