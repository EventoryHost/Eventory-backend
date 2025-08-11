import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

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
    required: false,
    validate: {
      validator: function(v) {
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
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[6-9]\d{9}$/.test(v);
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

// Basic instance methods for managing search history
salesExecutiveSchema.methods.addSearchHistory = function(vendorType, place) {
  const searchEntry = place ? `${vendorType}_${place}` : vendorType;
  this.vendor_search_history.push(searchEntry);
  
  // Keep only last 100 searches to prevent bloat
  if (this.vendor_search_history.length > 100) {
    this.vendor_search_history = this.vendor_search_history.slice(-100);
  }
  
  return this.save();
};

// Basic static methods
salesExecutiveSchema.statics.findBySalesExId = function(salesExId) {
  return this.findOne({ sales_ex_id: salesExId });
};

// Pre-save middleware
salesExecutiveSchema.pre('save', function(next) {
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
