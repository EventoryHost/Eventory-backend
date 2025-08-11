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
    value: {
      type: Boolean,
      default: false
    },
    stopped_at: {
      type: Date,
      required: false
    }
    // T/F - Create a JSON Object with this and below col
  },
  call_request: {
    value: {
      type: Boolean,
      default: false
    },
    requested_at: {
      type: Date,
      required: false
    }
    // T/F - Create a JSON Object with this and below col
  },
  req_to_join_wa_community: {
    value: {
      type: Boolean,
      default: false
    },
    join_community_req_at: {
      type: Date,
      required: false
    }
    // T/F - Create a JSON Object with this and below col
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
    required: true,
    enum: ['Caterer', 'Decorator', 'Photographer-Videographer', 'Makeup_Artist', 'Venue']
  },
  promo_type: {
    type: String,
    enum: ['sms', 'whatsapp', 'email', 'call'],
    default: 'whatsapp'
  },
  promo_content: {
    type: String,
    required: false
    // The actual promotional message content
  },
  response_received: {
    type: Boolean,
    default: false
  },
  response_type: {
    type: String,
    enum: ['interested', 'not_interested', 'callback_requested', 'no_response'],
    default: 'no_response'
  },
  follow_up_scheduled: {
    type: Date,
    required: false
  },
  conversion_status: {
    type: String,
    enum: ['lead', 'qualified', 'converted', 'rejected'],
    default: 'lead'
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
promotionsSchema.index({ conversion_status: 1 });
promotionsSchema.index({ response_received: 1 });
promotionsSchema.index({ follow_up_scheduled: 1 });

// Virtual for getting promo frequency
promotionsSchema.virtual('daysSinceLastPromo').get(function() {
  const now = new Date();
  const diff = now - this.last_sent_at;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Instance methods
promotionsSchema.methods.stopPromotions = function() {
  this.is_promotions_stopped.value = true;
  this.is_promotions_stopped.stopped_at = new Date();
  return this.save();
};

promotionsSchema.methods.requestCall = function() {
  this.call_request.value = true;
  this.call_request.requested_at = new Date();
  return this.save();
};

promotionsSchema.methods.requestCommunityJoin = function() {
  this.req_to_join_wa_community.value = true;
  this.req_to_join_wa_community.join_community_req_at = new Date();
  return this.save();
};

promotionsSchema.methods.updateResponse = function(responseType, scheduleFollowUp = null) {
  this.response_received = true;
  this.response_type = responseType;
  
  if (scheduleFollowUp) {
    this.follow_up_scheduled = scheduleFollowUp;
  }
  
  return this.save();
};

promotionsSchema.methods.updateConversionStatus = function(status) {
  this.conversion_status = status;
  return this.save();
};

promotionsSchema.methods.sendNewPromo = function(content, type = 'whatsapp') {
  this.promo_content = content;
  this.promo_type = type;
  this.last_sent_at = new Date();
  this.response_received = false;
  this.response_type = 'no_response';
  
  return this.save();
};

// Static methods
promotionsSchema.statics.findBySalesPerson = function(salesPersonId) {
  return this.find({ promo_sent_by: salesPersonId });
};

promotionsSchema.statics.findByVendorType = function(vendorType) {
  return this.find({ vendor_type: vendorType });
};

promotionsSchema.statics.findActivePromotions = function() {
  return this.find({ 'is_promotions_stopped.value': false });
};

promotionsSchema.statics.findPendingFollowUps = function() {
  const now = new Date();
  return this.find({
    follow_up_scheduled: { $lte: now },
    conversion_status: { $in: ['lead', 'qualified'] }
  });
};

promotionsSchema.statics.getConversionReport = function(salesPersonId = null) {
  const matchQuery = salesPersonId ? { promo_sent_by: salesPersonId } : {};
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$conversion_status',
        count: { $sum: 1 },
        vendors: { $push: '$vendor_name' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        vendor_count: { $size: '$vendors' }
      }
    }
  ]);
};

promotionsSchema.statics.getResponseReport = function(salesPersonId = null) {
  const matchQuery = salesPersonId ? { promo_sent_by: salesPersonId } : {};
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          vendor_type: '$vendor_type',
          response_type: '$response_type'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.vendor_type',
        responses: {
          $push: {
            type: '$_id.response_type',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

promotionsSchema.statics.findDueForFollowUp = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    follow_up_scheduled: {
      $gte: today,
      $lt: tomorrow
    },
    conversion_status: { $in: ['lead', 'qualified'] }
  });
};

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
