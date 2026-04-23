import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const Schema = mongoose.Schema;

// Sales Executive Schema according to ERD only
const salesExecutiveSchema = new Schema({
  sales_ex_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("SAEX")
  },
  user_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  profile_photo: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid profile photo URL format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  contact_name: {
    type: String,
    required: true,
    trim: true
  },
  contact_number: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^\d{10}$/.test(v);
      },
      message: 'Invalid contact number format'
    }
  },
  vendor_search_history: [{
    type: String
    // Array of Strings ['$vendor_type_$place']
  }]
}, {
  timestamps: true,
  collection: 'sales_executives'
});

// Basic indexes for ERD fields
salesExecutiveSchema.index({ contact_number: 1 });

// Pre-save middleware
salesExecutiveSchema.pre('save', function (next) {
  // Ensure contact_number doesn't have any spaces or special characters
  if (this.contact_number) {
    this.contact_number = this.contact_number.replace(/[\s\-\(\)]/g, '');
  }

  next();
});

// Check if model already exists to prevent OverwriteModelError
const SalesExecutive = mongoose.models.SalesExecutive || mongoose.model('SalesExecutive', salesExecutiveSchema);

export default SalesExecutive;
export { salesExecutiveSchema };
