import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const catererSchema = new Schema({
  name: { type: String, required: true },
  managerName: { type: String, required: true },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  capacity: { type: String, required: true },

  cuisine_specialities: { type: [String], required: true },
  regional_specialities: { type: [String], required: true },
  service_style_offered: { type: [String], required: true },
  menu: { type: [String], required: true },
  vegOrNonVeg: { type: String, required: true },

  appetizers: [String],
  main_course: [String],
  beverages: [String],
  special_dietary_options: [String],
  pre_set_menus: [String],
  customizable: { type: Boolean },
  event_types_catered: { type: [String], required: true },
  additional_services: [String],
  staff_provided: { type: [String], required: true },
  equipment_provided: [String],
  minimum_order_requirements: { type: String, required: true },
  advance_booking_period: { type: String, required: true },

  cancellation_policy: {
    type: String,
  },
  tasting_sessions: { type: Boolean, required: true },
  business_licenses: { type: Boolean, required:false },
  food_safety_certificates: { type: Boolean, required: false },
  terms_and_conditions: {
    type: String,
  },
  photos: { type: [String], required: true },
  videos: { type: [String], required: true },

  client_testimonials: {
    type: String,
  },
});

const Caterer = model("Caterer", catererSchema);

export { Caterer, catererSchema };
