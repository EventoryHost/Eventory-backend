import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 999 }, // start from 999 so first increment = 1000
});

const Counter = mongoose.model("customer_counter", counterSchema); // model name can stay clean
export default Counter;
