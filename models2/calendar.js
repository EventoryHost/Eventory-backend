import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

// Calendar Schema according to ERD
const calendarSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // If event_source is eventory, use EVT prefix, else use EXT prefix
      const prefix = this.event_source === 'eventory' ? 'EVT' : 'EXT';
      return generateUniqueId(prefix);
    }
  },
  service_id: {
    type: String,
    required: true
  },
  event_source: {
    type: String,
    required: true,
    enum: ['eventory', 'external'],
    default: 'eventory'
  },
  event_start: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Event start date must be a valid date'
    }
  },
  event_end: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v) && v > this.event_start;
      },
      message: 'Event end date must be after event start date'
    }
  },
  event_description: {
    type: String,
    required: false,
    maxlength: 500
  },
  event_type: {
    type: String,
    required: true,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  event_highlight: {
    type: String,
    required: false,
    enum: ['teal', 'orange', 'indigo', 'blue', 'purple'],
    default: 'blue'
  }
}, {
  timestamps: true,
  collection: 'calendar'
});

// Indexes for better performance and queries
calendarSchema.index({ service_id: 1 });
calendarSchema.index({ event_start: 1 });
calendarSchema.index({ event_end: 1 });
calendarSchema.index({ event_type: 1 });
calendarSchema.index({ event_source: 1 });
calendarSchema.index({ event_start: 1, event_end: 1 }); // Compound index for date range queries
calendarSchema.index({ service_id: 1, event_start: 1 }); // For service-specific calendar views

// Pre-save middleware to automatically update event_type based on dates
calendarSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.event_type !== 'cancelled') {
    if (this.event_end < now) {
      this.event_type = 'completed';
    } else if (this.event_start <= now && this.event_end >= now) {
      this.event_type = 'ongoing';
    } else if (this.event_start > now) {
      this.event_type = 'upcoming';
    }
  }
  
  next();
});

const Calendar = mongoose.model('Calendar', calendarSchema);

export { Calendar, calendarSchema };
