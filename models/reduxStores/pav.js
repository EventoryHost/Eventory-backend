import { Duration } from "@aws-sdk/client-pinpoint";
import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const photographerSchema = Schema(
  {
    id: { type: String },
    pageNumber: { type: Number, default: 1 },
    type: { type: String },
    name: { type: String },
    numberOfMembers: { type: String },
    clientTestimonials: { type: String },
    portfolio: { type: String },
    specialization: { type: [String] },
    serviceAreas: { type: [String] },
    eventTypes: { type: [String] },
    customizablePackage: { type: Boolean, default: undefined },
    customizableSoundAndLightingRates: { type: Boolean, default: undefined },
    equipmentAvailable: { type: [String] }, // To handle photoequipments
    address: { type: String },
    longitude: { type: Number },
    latitude: { type: Number },
    cancellationPolicy: { type: [String] },
    termsAndConditions: { type: [String] },
    rates: {
      packageRates: {
        hourly: [{ name: String, min: String, max: String }],
        deals: [{ name: String, min: String, max: String }],
        workers: [{ name: String, min: String, max: String }],
      },
    },
    photos: { type: [String] },
    videos: { type: [String] },
    fullName: { type: String },
    description: { type: String },
    eventType: { type: String, default: "Photographer" },
    eventsize: { type: String },
    events: { type: [String] },

    // Added missing fields from the API request
    photoSelectedstyles: { type: [String] }, // Photo styles selected
    photoequipments: { type: [String] }, // Photo equipment list
    photoAddons: { type: [String] }, // Photo Add-ons
    photofinaldeliverymethods: { type: [String] }, // Final delivery methods for photos
    videoSelectedstyles: { type: [String] }, // Video styles selected
    equipments: { type: [String] }, // Video equipments (API spelling)
    videoAddons: { type: [String] }, // Video Add-ons
    videofinaldeliverymethods: { type: [String] }, // Final delivery methods for videos
    Selectedvideoequipments: { type: [String] }, // Video equipments (API spelling)

    Durationoffinaldelivery: { type: String },
    Packagetype: { type: String },
    proposalsToClients: { type: Boolean, default: undefined },
    freeInitialConsultation: { type: Boolean, default: undefined },
    advanceSetup: { type: Boolean, default: undefined },
    availablefordestinationevents: { type: Boolean, default: undefined },
    postproductionservices: { type: Boolean, default: undefined },
    bookingDeposit: { type: Boolean, default: undefined },

    Recongnition_awards: { type: String },
    websiteurl: { type: String },
    intstagramurl: { type: String },
    advbookingperiod: { type: String },
    writtenthemeproposalafterconsultaion: { type: Boolean },
    freerevisionforinitialthemeproposal: { type: Boolean },
    priceStarts: { type: String },
  },
  { timestamps: true },
);

const PAVModel = model("ReduxPhotographer", photographerSchema);

export default PAVModel;
