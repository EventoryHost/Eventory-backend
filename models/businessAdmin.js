import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Business Admin Schema — plain-text passwords, simple auth
const businessAdminSchema = new Schema(
  {
    business_admin_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUniqueId("BA"),
    },
    user_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Plain-text password — no hashing
    password: {
      type: String,
      required: true,
    },
    contact_name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "Business Admin",
    },
  },
  {
    timestamps: true,
    collection: "business_admins",
  },
);

const BusinessAdmin =
  mongoose.models.BusinessAdmin ||
  mongoose.model("BusinessAdmin", businessAdminSchema);

export default BusinessAdmin;
export { businessAdminSchema };
