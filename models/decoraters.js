import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;
import  generateUniqueId  from "../utils/generateId.js";



const decoratorSchema = Schema({
  name: { type: String, required: true },
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },

  eventTypes: {
    types: { type: [String], default: [] },
    wedding: { type: [String], default: [] },
    corporate: { type: [String], default: [] },
    seasonal: { type: [String], default: [] },
    cultural: { type: [String], default: [] },
  },

  themesOffered: { type: [String], default: [] },
  propSelection: { type: Boolean, default: false },
  colorSchemeAssistance: { type: Boolean, default: false },
  themeCustomization: { type: Boolean, default: false },
  venueAdaptability: { type: Boolean, default: false },
  customDesignProcess: { type: String },

  themeElements: { type: [String], default: [] },
  backdropOptions: { type: String, customisable: Boolean },
  stageDecorationOptions: { type: String, customisable: Boolean },
  propAndAccessorySelection: { type: String, customisable: Boolean },

  freeConsultation: { type: Boolean, default: false },
  writtenThemeProposal: { type: Boolean, default: false },
  setupAndInstallation: { type: Boolean, default: false },
  proposalRevisions: { type: Boolean, default: false },
  consultationProcess: { type: String },

  packageRates: {
    hourly: [{ name: String, min: String, max: String }],
    daily: [{ name: String, min: String, max: String }],
    additionalCharges: [{ name: String, min: String, max: String }],
  },

  advancePayment: { type: String, required: true },

  portfolio: { type: [String], default: [] },
  clientTestimonials: { type: [String], default: [] },
  onlineRatings: { type: [String] },
  awards: { type: [String], default: [] },
  insurancePolicy: { type: String },
  cancellationPolicy: { type: String },
  termsAndConditions: { type: String },
  privacyPolicy: { type: String },
});

const Decorator = model("Decorator", decoratorSchema);

export { Decorator, decoratorSchema };
