import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

export const eventSchema = new Schema({
    calendarId: { type: String, default: generateUniqueId("cal") },
    end: { type: Date, required: true },
    id: { type: String, required: true },
    start: { type: Date, required: true },
    description: { type: String },
    color: {
        type: String,
        enum: ["yellow", "green"], 
        default: "yellow",
    }, // Event color
    title: { type: String, required: true },
});
