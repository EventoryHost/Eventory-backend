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
    mobile: { type: String, required: true },
    event: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    time: { type: String, required: true },
    budget: { type: String, required: true },
    number_of_guest: { type: String, required: true },
    requirements: { type: String, required: true },
    location: { type: String, required: false },
    event_type: { type: [String], required: true },
  },
  { timestamps: true }
);

quotationSchema.plugin(AutoIncrement, { inc_field: "quoteNumber" });

const Quotation = mongoose.model("quotation", quotationSchema);
export { Quotation };
