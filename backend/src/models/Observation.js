const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return (
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message: 'coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false },
);

const observationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    domain: { type: String, required: true, trim: true, index: true },
    source: {
      name: { type: String, required: true, trim: true },
      externalId: { type: String, trim: true },
    },
    location: { type: pointSchema, required: true },
    timestamp: { type: Date, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
  },
  {
    collection: 'observations',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

observationSchema.index({ location: '2dsphere' });
observationSchema.index({ type: 1, timestamp: -1 });
observationSchema.index(
  { 'source.name': 1, 'source.externalId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'source.externalId': { $type: 'string' } },
  },
);

module.exports = mongoose.model('Observation', observationSchema);
