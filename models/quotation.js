import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence"; // Use AutoIncrementFactory for initialization

const AutoIncrement = AutoIncrementFactory(mongoose);

const quotationSchema = new mongoose.Schema(
  {
    // Meta Data
    user_id: { type: String, required: true },
    vendor_id: { type: String, required: true },
    service_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "In Progress"],
      default: "Pending",
    },
    quoteNumber: { type: Number, unique: true },

    // Data
    user_name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: Number, required: true },
    event: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    budget: { type: String, required: true },
    number_of_guest: { type: String, required: true },
    requirements: { type: String, required: true },
    details: {
      type: Object,
      required: true,
      validate: {
        validator: function (value) {
          const serviceId = this.service_id;

          const serviceRules = {
            venue_provider: {},
            catering: { city: "string" },
            decorator: { location: "string" },
            makeup_artist: { location: "string" },
            photography: { location: "string" },
            prop_rentals: { location: "string" },
          };

          const requiredFields = serviceRules[serviceId];
          if (!requiredFields) {
            throw new Error(`Unknown service_id: ${serviceId}`);
          }

          // Validate each field
          for (const [field, type] of Object.entries(requiredFields)) {
            if (!(field in value)) {
              throw new Error(
                `Missing field: ${field} in details for service_id: ${serviceId}`
              );
            }

            const fieldValue = value[field];
            if (
              (type === "string" && typeof fieldValue !== "string") ||
              (type === "number" && typeof fieldValue !== "number") ||
              (type === "date" && !(fieldValue instanceof Date))
            ) {
              throw new Error(
                `Invalid type for field: ${field}. Expected ${type}, got ${typeof fieldValue} in service_id: ${serviceId}`
              );
            }
          }

          return true;
        },
        message: (props) => props.reason || "Invalid details field",
      },
    },
  },
  { timestamps: true }
);

quotationSchema.plugin(AutoIncrement, { inc_field: "quoteNumber" });

const qutoation = mongoose.model("quotation", quotationSchema);
export default qutoation;
