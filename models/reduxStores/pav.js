import { Duration } from "@aws-sdk/client-pinpoint";
import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const photographerSchema = Schema({
  userId: { type: String },
  type: { type: String },
  name: { type: String },
  numberOfMembers: { type: String },
  clientTestimonials: { type: String },
  portfolio: { type: String },
  specialization: { type: [String] },
  eventTypes: { type: [String] },
  customizablePackage: { type: Boolean, default: false },
  customizableSoundAndLightingRates: { type: Boolean, default: false },
  equipmentAvailable: { type: [String] },  // To handle photoequipments
  designProposals: { type: Boolean, default: false },
  freeInitialConsultation: { type: Boolean, default: false },
  advanceSetup: { type: Boolean, default: false },
  collaborateWithVendors: { type: Boolean, default: false },
  setupAndInstallation: { type: Boolean, default: false },
  bookingDepositRequired: { type: Boolean, default: false },
  cancellationPolicy: { type: [String] },
  termsAndConditions: { type: [String] },
  rates: {
    packageRates: {
      hourly: [{ name: String, min: String, max: String }],
      deals: [{ name: String, min: String, max: String }],
      workers: [{ name: String, min: String, max: String }],
    },
  },
  fullName: { type: String },
  description: { type: String },
  eventsize: { type: String },
  events: { type: [String] },

  // Added missing fields from the API request
  photoSelectedstyles: { type: [String] },  // Photo styles selected
  photoequipments: { type: [String] },      // Photo equipment list
  photoAddons: { type: [String] },          // Photo Add-ons
  photofinaldeliverymethods: { type: [String] },  // Final delivery methods for photos
  videoSelectedstyles: { type: [String] },  // Video styles selected
  equipments: { type: [String] },           // Video equipments (API spelling)
  videoAddons: { type: [String] },          // Video Add-ons
  videofinaldeliverymethods: { type: [String] },  // Final delivery methods for videos
  Selectedvideoequipments: { type: [String] },  // Video equipments (API spelling)


  Durationoffinaldelivery: { type: String },
  Packagetype: { type: String },
  availablefordestinationevents: { type: String },
  postproductionservices: { type: String },
  proposalsToClients: { type: String },
  freeInitialConsultation: { type: String },
  advanceSetup: { type: String },
  bookingDeposit: { type: String },

  Recongnition_awards: { type: String },
  websiteurl: { type: String },
  intstagramurl: { type: String },
  advbookingperiod: { type: String },
  writtenthemeproposalafterconsultaion: { type: Boolean },
  freerevisionforinitialthemeproposal: { type: Boolean },


}, { timestamps: true });

const PAVModel = model("ReduxPhotographer", photographerSchema);

export default PAVModel;
