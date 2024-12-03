import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
import { eventSchema } from "./venue.js";
const Schema = _Schema;

const catererSchema = new Schema({
  basicDetails: {
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    capacity: { type: String, required: true },
    description: { type: String, required: true },
    cuisine_specialities: { type: [String], required: true },
    regional_specialities: { type: [String], required: true },
    service_style_offered: { type: [String], required: true },
  },
  menuDetails: {
    menu: { type: [String], required: true },
    vegOrNonVeg: { type: String },
    appetizers: [String],
    main_course: [String],
    beverages: [String],
    special_dietary_options: [String],
    pre_set_menus: [String],
    customizable: { type: Boolean },
  },
  eventDetails: {
    event_types_catered: { type: [String], required: true },
    additional_services: [String],
  },
  staffAndEquipmentDetails: {
    staff_provided: { type: [String], required: true },
    equipment_provided: [String],
  },
  additionalDetails: {
    minimum_order_requirements: { type: String, required: true },
    advance_booking_period: { type: String, required: true },
    photos: { type: [String], required: true },
    videos: { type: [String], required: true },
    tasting_sessions: { type: Boolean, required: true },
    business_licenses: { type: Boolean, required: false },
    food_safety_certificates: { type: [String], required: true },
    priceStartingFrom: { type: String, required: true },
  },
  policies: {
    cancellation_policy: {
      type: String,
    },

    terms_and_conditions: {
      type: String,
    },

    client_testimonials: {
      type: String,
    },
  },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorType: { type: String, default: "caterer" },
  schedule: [eventSchema],

});

const Caterer = model("Caterer", catererSchema);

export { Caterer, catererSchema };
