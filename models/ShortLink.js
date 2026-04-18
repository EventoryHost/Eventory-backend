import mongoose from 'mongoose';

const shortLinkSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalUrl: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const ShortLink = mongoose.model('ShortLink', shortLinkSchema);
export default ShortLink;
