import mongoose from "mongoose";

const salesSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Sales = mongoose.model('sales', salesSchema);
export default Sales;
