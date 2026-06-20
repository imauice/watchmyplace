const mongoose = require('mongoose');

const appDeviceSchema = new mongoose.Schema(
  {
    appInstanceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      default: 'android',
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'app_devices',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

module.exports = mongoose.model('AppDevice', appDeviceSchema);

