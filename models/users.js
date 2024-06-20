import { Schema as _Schema } from "mongoose";
const Schema = _Schema;

const userSchema = new Schema({
  name: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  type: { type: String },
});

export default userSchema;
