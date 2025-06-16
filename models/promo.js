import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const promotionsSchema = new Schema({
    phoneNumber: { type: String, required: true }, 
    canSend: { type: Boolean, default: true }, 
    sentBeforeCount: { type: Number, default: 0 }, 
    callRequest: { 
        status: { type: Boolean, default: false }, 
        date: { type: Date, default: null }
     }, 
    isLegit: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
    vendorName: { type: String, required: true }, 
    vendorType: { type: String, required: true },
});

const Promotion = model("Promotion", promotionsSchema);
export { Promotion };
