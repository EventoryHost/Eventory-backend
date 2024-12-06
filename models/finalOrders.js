
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    vendorType: {
        type: String,
        enum: ['caterer', 'decorator', 'pav', 'prop-rental' , 'venue-provider' , 'Other'],

    },
    vendorId: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, },
    customerName: { type: String, },
    vendorName: { type: String, },
    finalPrice: { type: Number, },
    finalizedContents: [
        {
            itemName: { type: String, },
            quantity: { type: Number, default: 1 },
            price: { type: Number, }
        }
    ],
    description: { type: String },
    quoteNumber : { type: String, },
    eventDate: { type: String, },
    bookingDate: { type: Date, default: Date.now },
    contactDetails: {
        email: { type: String, },
        phone: { type: String, }
    },
    event_name: { type: String, },
    number_of_guest : { type: String, },
    time : { type: String, },
    budget : { type: String, },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'Pending'
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
            default: 'Unpaid'
        },
    },
}, { timestamps: true });


export default mongoose.model('Order', OrderSchema);

