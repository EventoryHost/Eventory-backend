import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

const Schema = mongoose.Schema;

// Event Manager Schema according to ERD only
const eventManagerSchema = new Schema({
  em_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("EM")
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
    required: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid contact number format'
    }
  },
  yoe: {
    type: String,
    required: true
    // Years of Experience (default: ask when they joined eventory)
  },
  number_of_events_exp: {
    type: String,
    required: true
    // Default: ask count + count of eventory_events
  },
  doj: {
    type: Date,
    required: true
    // Date of joining eventory
  },
  eventory_events: [{
    type: String
    // Array of event_ids
  }],
  eventory_orders: [{
    type: String
    // Array of order_ids
  }],
  eventory_chats: [{
    type: String
    // Array of chat_ids
  }]
}, {
  timestamps: true,
  collection: 'event_managers'
});

// Indexes for better performance
eventManagerSchema.index({ contact_number: 1 });

// Pre-save middleware
eventManagerSchema.pre('save', function(next) {
  // Ensure contact_number doesn't have any spaces or special characters
  if (this.contact_number) {
    this.contact_number = this.contact_number.replace(/[\s\-\(\)]/g, '');
  }
  
  next();
});

// Check if model already exists to prevent OverwriteModelError
const EventManager = mongoose.models.EventManager || mongoose.model('EventManager', eventManagerSchema);

export default EventManager;
export { eventManagerSchema };
