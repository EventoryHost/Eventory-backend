import mongoose from "mongoose";

const user = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const User = mongoose.model('rmadmin', user);
export default User;