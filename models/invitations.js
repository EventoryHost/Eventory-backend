import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

const invitationSchema = new Schema({
  id: { type: String, default: generateUniqueId("ser"), required: true },
  venId: { type: String, required: true },
  portfolio: {
    type: String,
    required: true,
  },
  provideReferences: {
    type: Boolean,
    default: false,
  },
  yearsOfExperience: {
    type: String,
    required: true,
  },
  invitationTypes: {
    formal: {
      type: [String],
    },
    casual: {
      type: [String],
    },
    electronic: {
      type: [String],
    },
    handmade: {
      type: [String],
    },
    printed: {
      type: [String],
    },
    specialty: {
      type: [String],
    },
    unique: {
      type: [String],
    },
    religiousCultural: {
      type: [String],
    },
  },
  customInvitations: {
    fromScratch: {
      type: Boolean,
      default: false,
    },
    semiCustom: {
      type: Boolean,
      default: false,
    },
  },
  printingTechniques: {
    foilStamping: {
      type: Boolean,
      default: false,
    },
    engraving: {
      type: Boolean,
      default: false,
    },
    letterPress: {
      type: Boolean,
      default: false,
    },
  },
  preDesignedCardsAvailable: {
    type: Boolean,
    default: false,
  },
  cardstockWeights: {
    type: Boolean,
    default: false,
  },
  informationInserts: {
    type: Boolean,
    default: false,
  },
  paperTypes: {
    type: [String],
    default: [],
  },
  additionalStationeryProducts: {
    type: Boolean,
    default: false,
  },
  thankYouCards: {
    type: Boolean,
    default: false,
  },
  designProcess: {
    initialConceptsBasedOnInput: {
      type: Boolean,
      default: false,
    },
    consultationForVision: {
      type: Boolean,
      default: false,
    },
    decorativeEnvelopeLiners: {
      type: Boolean,
      default: false,
    },
    initialConsultations: {
      type: Boolean,
      default: false,
    },
    revisionsAllowed: {
      type: Boolean,
      default: false,
    },
    proofsProvided: {
      type: Boolean,
      default: false,
    },
  },
  envelopeTypes: {
    type: [String],
    default: [],
  },
  termsAndConditions: {
    type: String,
  },
  cancellationPolicy: {
    type: String,
  },
  extraChargesForCustomDesigns: {
    type: Boolean,
    default: false,
  },
  clientTestimonials: {
    type: String,
    trim: true,
  },
  depositRequired: {
    type: Boolean,
    default: false,
  },
  packageRates: {
    per_piece: [{ name: String, min: String, max: String }],
    bulk: [{ name: String, min: String, max: String }],
  },

  advancePayment: { type: String },
});

const Invitation = model("Invitations", invitationSchema);

export default { Invitation, invitationSchema };
