const Observation = require('../models/Observation');
const Impact = require('../models/Impact');
const {
  qualifiesForHeavyRainImpact,
  buildHeavyRainImpact,
} = require('../services/impact.service');

async function runImpactWorker(now = new Date()) {
  const observations = await Observation.find({
    type: 'weather.heavy_rain_forecast',
    timestamp: {
      $gte: now,
      $lte: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    },
  }).lean();

  let created = 0;
  for (const observation of observations) {
    if (!qualifiesForHeavyRainImpact(observation, now)) continue;
    const impact = buildHeavyRainImpact(observation, now);
    const result = await Impact.updateOne(
      {
        sourceObservationId: impact.sourceObservationId,
        type: impact.type,
      },
      { $setOnInsert: impact },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
  }

  await Impact.updateMany(
    { status: 'active', validUntil: { $lt: now } },
    { $set: { status: 'expired' } },
  );

  return { examined: observations.length, created };
}

module.exports = { runImpactWorker };
