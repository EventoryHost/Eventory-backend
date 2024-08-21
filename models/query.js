import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;


const querySchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
});

const Query = model("Query", querySchema);

export default Query;