import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema({
    quotation_type: {
        type: String,
        required: true,
        enum: ["Cater", "Venue Provider", "Decor", "Makeup Artist", "Photography", "Prop Rental"]
    },
    full_name: {
        type: String,
        required: true
    },
    email_address: {
        type: String,
        required: true
    },
    mobile_number: {
        type: String,
        required: true
    },
    location: {
        type: String,
        validate: {
            validator: function(value) {
                // Require location only if quotation_type is not 'Venue Provider'
                return this.quotation_type === "Venue Provider" ? true : !!value;
            },
            message: "Location is required for non-Venue Provider quotations."
        }
    },
    event_type: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    budget: {
        type: String,
        required: true
    },
    number_of_guests: {
        type: String,
        validate: {
            validator: function(value) {
                // Require number_of_guests only if quotation_type is not 'Photography'
                return this.quotation_type === "Photography" ? true : !!value;
            },
            message: "Number of guests is required for non-Photography quotations."
        }
    },
    requirements: {
        type: String,
        required: true
    },
    vendor_id: {
        type: String,
        required: true
    },
    vendor_type: {
        type: String,
        required: false  // Optional field
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Accepted", "Rejected", "Replied"],
        default: "Pending" // Set default status to "Pending"
    }
}, { timestamps: true });

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
