import mongoose from "mongoose";
// import AutoIncrement from "mongoose-sequence";



const venueQuotationSchema = new mongoose.Schema({
    quoteNumber: {
        type: Number,
        unique: true,
    },
    event_name: {
        type: String,
        required: true,
    },
    number_of_guest: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    budget: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'In Progress'],
        default: 'Pending',
    },
    user_id: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    vendor_id: {
        type: String,
        required: true,
    },
    vendor_type: {
        type: String,
    },
}, { timestamps: true });

// venueQuotationSchema.plugin(AutoIncrement(mongoose), { inc_field: 'quoteNumber' });

// Correct export statement
const venueQuotation = mongoose.model('venueQuotation', venueQuotationSchema);
export default venueQuotation;  // Ensure default export
