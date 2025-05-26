import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    vendorType: {
        type: String,
        enum: ['caterer', 'decorator', 'pav', 'prop-rental', 'venue-provider', 'Other'],
    },
    vendorId: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String },
    customerName: { type: String }, // maps from user_name
    vendorName: { type: String },
    finalPrice: { type: Number },
    finalizedContents: [
        {
            itemName: { type: String },
            quantity: { type: Number, default: 1 },
            price: { type: Number },
        },
    ],
    description: { type: String }, // maps from requirements
    quoteNumber: { type: String },
    eventDate: { type: String }, // optional or legacy
    start_date: { type: String }, // added
    end_date: { type: String }, // added
    bookingDate: { type: Date, default: Date.now },
    contactDetails: {
        email: { type: String },
        phone: { type: String },
        mobile: { type: String }, // added
    },
    event_name: { type: String }, // optional
    event_type: { type: String }, // added
    number_of_guest: { type: String },
    time: { type: String },
    budget: { type: String },
    location: { type: String }, // added
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'approved', 'rejected'],
        default: 'pending',
    },
    paymentDetails: {
        paymentMethod: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Cash'],
        },
        transactionId: { type: String },
        paymentStatus: {
            type: String,
            enum: ['Paid', 'Unpaid'],
            default: 'Unpaid',
        },
    },
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
