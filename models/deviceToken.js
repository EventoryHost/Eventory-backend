import mongoose from "mongoose";

const deviceTokenSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  deviceToken: {
    // Unique check is handled by the index below
    type: String,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ["android", "ios", "web"],
    default: "android",
  },
  deviceId: {
    type: String, // Unique identifier from the client device (e.g., UUID)
    required: false, // Make this required if possible for best logout reliability
  },
}, {
  collection: 'device_tokens',
  timestamps: true // Automatically adds createdAt and updatedAt (in UTC)
});

// --- Indexes for Performance and Integrity ---

// 1. Index for fast notification sending (find all tokens for a user)
deviceTokenSchema.index({ vendorId: 1 });

// 2. Compound Unique Index: Ensures one vendor doesn't have the same token multiple times.
// This is the ideal index for upserting (updating/creating) a token.
deviceTokenSchema.index({ vendorId: 1, deviceToken: 1 }, { unique: true });

// 3. Index for device-specific lookup/removal (if deviceToken is unavailable)
deviceTokenSchema.index({ deviceId: 1 });


const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

export { DeviceToken, deviceTokenSchema };