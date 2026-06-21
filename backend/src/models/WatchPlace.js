const mongoose = require('mongoose');

const watchPlaceSchema = new mongoose.Schema(
  {
    appInstanceId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    placeType: { type: String, default: 'other', trim: true },
    location: {
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
    radiusMeters: {
      type: Number,
      required: true,
      min: 100,
      max: 20000,
      default: 500,
    },
    domains: {
      type: [String],
      default: ['weather'],
    },
    active: { type: Boolean, default: true, index: true },
  },
  {
    collection: 'watch_places',
    timestamps: true,
    versionKey: false,
  },
);

watchPlaceSchema.index({ location: '2dsphere' });
watchPlaceSchema.index({ appInstanceId: 1, active: 1 });

module.exports = mongoose.model('WatchPlace', watchPlaceSchema);
