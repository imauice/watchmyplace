const Observation = require('../models/Observation');

function normalizeSource(source) {
  if (typeof source === 'string') return { name: source };
  return source;
}

async function createObservation(input) {
  try {
    return await Observation.create({
      ...input,
      source: normalizeSource(input.source),
      timestamp: input.timestamp || input.observedAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      return Observation.findOne({
        'source.name': normalizeSource(input.source).name,
        'source.externalId': normalizeSource(input.source).externalId,
      });
    }
    throw error;
  }
}

async function findNearbyObservations({
  location,
  radiusMeters,
  fromTime,
  toTime,
  types,
  source,
  limit = 100,
}) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: location },
        $maxDistance: radiusMeters,
      },
    },
    timestamp: {
      ...(fromTime ? { $gte: new Date(fromTime) } : {}),
      ...(toTime ? { $lte: new Date(toTime) } : {}),
    },
  };

  if (types?.length) query.type = { $in: types };
  if (source) query['source.name'] = source;
  if (Object.keys(query.timestamp).length === 0) delete query.timestamp;

  return Observation.find(query).limit(Math.min(limit, 500)).lean();
}

async function findTimeWindowObservations({
  fromTime,
  toTime,
  types,
  source,
  limit = 100,
}) {
  const query = {
    timestamp: {
      $gte: new Date(fromTime),
      $lte: new Date(toTime),
    },
  };
  if (types?.length) query.type = { $in: types };
  if (source) query['source.name'] = source;

  return Observation.find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 500))
    .lean();
}

module.exports = {
  createObservation,
  findNearbyObservations,
  findTimeWindowObservations,
};
