const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vendorSchema = new Schema({
  name: { type: String },
  phone: { type: String, required: true },
  password: { type: String },
  email: { type: String },
});

module.exports = mongoose.model('Vendors', vendorSchema);
