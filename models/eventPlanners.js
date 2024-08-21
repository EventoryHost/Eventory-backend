import { decoratorSchema } from "./decoraters.js";
import { venueSchema } from "./venue.js";
import { catererSchema } from "./caterer.js";
import transport from "./transport.js";
import invitation from "./invitations.js";

import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

delete catererSchema.id;
delete catererSchema.venId;

delete transport.transportSchema.id;
delete transport.transportSchema.venId;

delete invitation.invitationSchema.id;
delete invitation.invitationSchema.venId;

delete venueSchema.id;
delete venueSchema.venId;

delete decoratorSchema.id;
delete decoratorSchema.venId;

const eventPlannerSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  vendorName: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  eventTypes: {
    type: [String],
    default: [],
  },
  servicesProvided: {
    type: [String],
    default: [],
  },
  decor: decoratorSchema,
  venueProvider: venueSchema,
  catering: catererSchema,
  transport: transport.transportSchema,
  invitation: invitation.invitationSchema,

  packageRates: {
    per_theme: [{ name: String, min: String, max: String }],
    package: [{ name: String, min: String, max: String }],
    additionalCharges: [{ name: String, min: String, max: String }],
  },
  advancePayment: { type: String },
  budget: { type: String },
  custom: { type: Boolean, default: false },
  portfolio: { type: [String], default: [] },
  clientTestimonials: { type: [String], default: [] },
  onlineRatings: { type: [String] },
  awards: { type: [String], default: [] },
  insurancePolicy: { type: String },
  cancellationPolicy: { type: String },
  termsAndConditions: { type: String },
  privacyPolicy: { type: String },
  specializations: { type: String },
});

const EventPlanner = model("EventPlanner", eventPlannerSchema);

export default EventPlanner;
