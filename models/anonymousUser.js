import mongoose from "mongoose";
import generateUniqueId from "../utils/generateId.js";

const anonymousUserSchema = new mongoose.Schema({
  anon_id: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUniqueId("ANON")
  },
  first_seen_at: {
    type: Date,
    default: Date.now
  },
  last_seen_at: {
    type: Date,
    default: Date.now
  },
  acquisition: {
    source: { type: String, default: 'direct' },
    fbclid: String,
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_adset: String,
    utm_ad: String,
    utm_term: String,
    utm_content: String,
    utm_id: String,
    landing_page: String,
    referrer: String
  },
  device: {
    ip_hash: String,
    user_agent: String,
    platform: String,
    screen_width: Number,
    screen_height: Number
  },
  converted_user_id: {
    type: String,
    ref: 'Customers',
    default: null
  }
}, {
  collection: 'anonymous_users'
});

anonymousUserSchema.index({ 'acquisition.fbclid': 1 });
anonymousUserSchema.index({ 'acquisition.utm_campaign': 1 });
anonymousUserSchema.index({ first_seen_at: -1 });

const AnonymousUser = mongoose.model('AnonymousUser', anonymousUserSchema);

export default AnonymousUser;
