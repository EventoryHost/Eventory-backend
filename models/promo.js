import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const promotionsSchema = new Schema({
    phoneNumber: { type: String, required: true },

    canSend: {
        value: { type: Boolean, default: true },
        updatedAt: { type: Date, default: Date.now }
    },

    sentBeforeCount: {
        value: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now }
    },

    callRequest: {
        value: { type: Boolean, default: false },
        updatedAt: { type: Date, default: null }
    },

    reqToJoinCommunity: {
        value: { type: Boolean, default: false },
        updatedAt: { type: Date, default: null }
    },

    lastSentDate: { type: Date, default: Date.now }, // last promotion sent
    vendorName: { type: String, required: true },
    vendorType: { type: String, required: true },
});


const Promotion = model("Promotion", promotionsSchema);
export { Promotion };
