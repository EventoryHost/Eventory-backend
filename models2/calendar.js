import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId2.js";

// Calendar Schema according to ERD
const calendarSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // If event_source is eventory, use EVTY prefix, else use EXTY prefix
      const prefix = this.event_source === 'EVENTORY' ? 'EVTY' : 'EXTY';
      return generateUniqueId(prefix);
    }
  },
  service_id: {
    type: String,
    required: true
  },
  event_name: {
    type: String
  },
  event_source: {
    type: String,
    required: true,
    enum: ['EVENTORY', 'EXTERNAL'],
    default: 'EVENTORY'
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
    type: String
  },
  event_type: {
    type: String,
    required: true,
    enum: ['booked','upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  event_highlight: {
    type: String,
    enum: ['teal', 'orange', 'indigo', 'blue', 'purple'],
    default: 'blue'
  },
  event_created_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  },
  event_updated_at: {
    type: Date,
    default: () => {
      // Convert to IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(now.getTime() + istOffset);
    }
  }
}, {
  collection: 'calendar'
});

// Pre-save middleware to update event_updated_at on every save
calendarSchema.pre('save', function(next) {
  if (!this.isNew) {
    // Convert to IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    this.event_updated_at = new Date(now.getTime() + istOffset);
  }
  next();
});

// Pre-update middleware to update event_updated_at on updates
calendarSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  // Convert to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  this.set({ event_updated_at: new Date(now.getTime() + istOffset) });
  next();
});

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

// Indexes for better performance and queries
calendarSchema.index({ service_id: 1 });
calendarSchema.index({ event_start: 1 });
calendarSchema.index({ event_end: 1 });
calendarSchema.index({ event_type: 1 });
calendarSchema.index({ event_source: 1 });
calendarSchema.index({ event_start: 1, event_end: 1 }); // Compound index for date range queries
calendarSchema.index({ service_id: 1, event_start: 1 }); // For service-specific calendar views
calendarSchema.index({ event_created_at: -1 }); // Index for timestamp queries
calendarSchema.index({ event_updated_at: -1 }); // Index for recent updates

const Calendar = mongoose.model('Calendar', calendarSchema);

export { Calendar, calendarSchema };
