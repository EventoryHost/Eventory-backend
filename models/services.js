import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const serviceSchema = new Schema({
  id: { type: String, required: true },
  photo: { type: String, required: true },
  description: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: String, required: true },
  type: { type: String, required: true },
});

const Service = model("Service", serviceSchema);

export { Service, serviceSchema };