import { Schema as _Schema, model } from "mongoose";
import generateUniqueId from "../utils/generateId.js";
const Schema = _Schema;

export const eventSchema = new Schema({
    calendarId: { type: String, default: generateUniqueId("cal") }, // Example: "upcoming"
    end: { type: Date, required: true }, // End time, e.g., "2024-11-06 20:30"
    id: { type: String, required: true }, // Unique event id
    start: { type: Date, required: true }, // Start time, e.g., "2024-11-06 19:30"
    description: { type: String },
    color: {
        type: String,
        enum: ["teal", "orange", "indigo", "blue", "purple"],
        default: "indigo",
    }, // Event color
    title: { type: String, required: true }, // Event title
});