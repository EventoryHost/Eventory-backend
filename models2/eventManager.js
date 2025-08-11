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

// Instance methods for managing arrays
eventManagerSchema.methods.assignEvent = function(eventId) {
  if (!this.eventory_events.includes(eventId)) {
    this.eventory_events.push(eventId);
    return this.save();
  }
  return Promise.resolve(this);
};

eventManagerSchema.methods.assignOrder = function(orderId) {
  if (!this.eventory_orders.includes(orderId)) {
    this.eventory_orders.push(orderId);
    return this.save();
  }
  return Promise.resolve(this);
};

eventManagerSchema.methods.assignChat = function(chatId) {
  if (!this.eventory_chats.includes(chatId)) {
    this.eventory_chats.push(chatId);
    return this.save();
  }
  return Promise.resolve(this);
};

eventManagerSchema.methods.removeEvent = function(eventId) {
  this.eventory_events = this.eventory_events.filter(id => id !== eventId);
  return this.save();
};

eventManagerSchema.methods.removeOrder = function(orderId) {
  this.eventory_orders = this.eventory_orders.filter(id => id !== orderId);
  return this.save();
};

eventManagerSchema.methods.removeChat = function(chatId) {
  this.eventory_chats = this.eventory_chats.filter(id => id !== chatId);
  return this.save();
};

// Basic static methods
eventManagerSchema.statics.findByEMId = function(emId) {
  return this.findOne({ em_id: emId });
};

eventManagerSchema.statics.getEMStats = function(emId) {
  return this.findOne({ em_id: emId }).then(em => {
    if (!em) return null;
    
    return {
      em_id: em.em_id,
      user_name: em.user_name,
      total_events: em.eventory_events.length,
      total_orders: em.eventory_orders.length,
      active_chats: em.eventory_chats.length
    };
  });
};

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
