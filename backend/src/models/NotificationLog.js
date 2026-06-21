const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    appInstanceId: { type: String, required: true, index: true },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WatchPlace',
      required: true,
    },
    impactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Impact',
      required: true,
    },
    type: { type: String, required: true },
    severity: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    messageId: String,
    error: String,
    sentAt: Date,
  },
  {
    collection: 'notification_logs',
    timestamps: true,
    versionKey: false,
  },
);

notificationLogSchema.index({ impactId: 1, placeId: 1 }, { unique: true });
notificationLogSchema.index({ placeId: 1, type: 1, sentAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
