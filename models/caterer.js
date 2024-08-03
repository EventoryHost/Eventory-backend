import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const catererSchema = new Schema({
  name: { type: String, required: true },
  managerName: { type: String, required: true },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },

  cuisine_specialities: [String],
  regional_specialities: [String],
  service_style_offered: [String],
  menu: String,
  menuType: String,

  appetizers: [String],
  main_course: [String],
  beverages: [String],
  special_dietary_options: [String],
  pre_set_menus: [String],
  customizable: { type: Boolean },
  event_types_catered: [String],
  additional_services: [String],
  staff_provided: [String],
  equipment_provided: [String],
  minimum_order_requirements: String,
  advance_booking_period: String,
  deposit_required: String,
  per_plate_rates: [
    {
      package_name: String,
      max: String,
      min: String,
    },
  ],
  deal_package_rates: [
    {
      package_name: String,
      max: String,
      min: String,
    },
  ],

  cancellation_policy: {
    type: String,
    required: true,
  },
  tasting_sessions: { type: Boolean, default: false },
  business_licenses: { type: Boolean, default: false },
  food_safety_certificates: { type: Boolean, default: false },
  terms_and_conditions: {
    type: String,
    required: true,
  },
  portfolio: [String],
});

const Caterer = model("Caterer", catererSchema);

export default { Caterer, catererSchema };
