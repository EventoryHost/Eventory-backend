import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const photographerSchema = Schema({
    userId: { type: String },
    type: {
        type: String,
    },
    name: {
        type: String,
    },
    numberOfMembers: {
        type: String,
    },
    clientTestimonials: {
        type: [String],
    },
    portfolio: {
        type: [String],
    },
    specialization: {
        type: [String],
    },
    eventTypes: {
        type: [String],
    },
    customizablePackage: {
        type: Boolean,
        default: false,
    },
    customizableSoundAndLightingRates: {
        type: Boolean,
        default: false,
    },
    equipmentAvailable: {
        type: [String],
    },
    designProposals: {
        type: Boolean,
        default: false,
    },
    freeInitialConsultation: {
        type: Boolean,
        default: false,
    },
    advanceSetup: {
        type: Boolean,
        default: false,
    },
    collaborateWithVendors: {
        type: Boolean,
        default: false,
    },
    setupAndInstallation: {
        type: Boolean,
        default: false,
    },
    bookingDepositRequired: {
        type: Boolean,
        default: false,
    },
    cancellationPolicy: {
        type: [String],
    },
    termsAndConditions: {
        type: [String],
    },
    rates: {
        packageRates: {
            hourly: [{ name: String, min: String, max: String }],
            deals: [{ name: String, min: String, max: String }],
            workers: [{ name: String, min: String, max: String }],
        },
    },
}, { timestamps: true });

const PAVModel = model("ReduxPhotographer", photographerSchema);

export default PAVModel;
