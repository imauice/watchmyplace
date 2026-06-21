const mongoose = require('mongoose');

const impactSchema = new mongoose.Schema(
  {
    sourceObservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Observation',
      required: true,
    },
    type: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['watch', 'warning', 'critical'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: { type: [Number], required: true },
    },
    radiusMeters: { type: Number, required: true, min: 1 },
    eta: { type: Date, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'resolved'],
      default: 'active',
      index: true,
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true, index: true },
  },
  {
    collection: 'impacts',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

impactSchema.index({ location: '2dsphere' });
impactSchema.index({ sourceObservationId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Impact', impactSchema);
