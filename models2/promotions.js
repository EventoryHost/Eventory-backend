import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Promotions Schema according to ERD
const promotionsSchema = new Schema({
  promo_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("PROMO")
  },
  promo_sent_by: {
    type: String,
    required: true
    // Sales Person ID
  },
  promo_sent_to: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid mobile number format'
    }
    // mobile_no
  },
is_promotions_stopped: {
  type: Boolean,
  default: false
},
  promotions_stopped_at: {
    type: Date,
    required: false
    // Separate field as per ERD
  },
  call_request: {
    type: Boolean,
    default: false
  },
  call_requested_at: {
    type: Date,
    required: false
    // Separate field as per ERD
  },
  req_to_join_wa_community: {
    type: Boolean,
    default: false
  },
  join_community_req_at: {
    type: Date,
    required: false
    // Separate field as per ERD
  },
  last_sent_at: {
    type: Date,
    default: Date.now
    // YYYY-MM-DD HH:MM:SS
  },
  vendor_name: {
    type: String,
    required: true
  },
  vendor_type: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'promotions'
});

// Indexes for better performance
promotionsSchema.index({ promo_sent_by: 1 });
promotionsSchema.index({ promo_sent_to: 1 });
promotionsSchema.index({ vendor_type: 1 });
promotionsSchema.index({ last_sent_at: -1 });

// Pre-save middleware
promotionsSchema.pre('save', function(next) {
  // Ensure mobile number doesn't have any spaces or special characters
  if (this.promo_sent_to) {
    this.promo_sent_to = this.promo_sent_to.replace(/[\s\-\(\)]/g, '');
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const Promotions = mongoose.models.Promotions || mongoose.model('Promotions', promotionsSchema);

export default Promotions;
export { promotionsSchema };
