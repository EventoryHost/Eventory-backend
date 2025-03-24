import { Schema as _Schema, model } from 'mongoose';

const Schema = _Schema;

const waMessageSchema = new Schema({
    msgId: {
        type: String,
        required: true,
        unique: true
    },
    cusId: {
        type: String,
        required: true
    },
    venId: {
        type: String,
        required: true
    },
    quoId: {
        type: String,
        required: true
    },
    message: {
        from: {
            type: String,
            required: true
        },
        to: {
            type: String,
            required: true
        },
        body: {
            type: String,
            required: true
        }
    }
}, {
    timestamps: true
});

export default model('WAMessage', waMessageSchema);