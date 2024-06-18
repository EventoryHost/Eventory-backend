const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  type: { type: String },
});

module.exports = userSchema