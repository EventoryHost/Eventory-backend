import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const reactoutquerySchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  mobileno: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const reactoutQuery = model("reactoutQuery", reactoutquerySchema);

export default reactoutQuery;
