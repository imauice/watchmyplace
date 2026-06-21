const riskConfig = require('../config/risk');

function qualifiesForHeavyRainImpact(observation, now = new Date()) {
  if (observation.type !== 'weather.heavy_rain_forecast') return false;
  const probability = observation.payload?.precipitationProbability ?? 0;
  const etaMs = new Date(observation.timestamp).getTime() - now.getTime();
  const maxEtaMs =
    riskConfig.impacts.heavyRainMaxEtaHours * 60 * 60 * 1000;

  return probability >= 70 && etaMs >= 0 && etaMs <= maxEtaMs;
}

function buildHeavyRainImpact(observation, now = new Date()) {
  const probability = observation.payload.precipitationProbability;
  return {
    sourceObservationId: observation._id,
    type: 'weather.heavy_rain_possible',
    domain: 'weather',
    severity: probability >= 90 ? 'warning' : 'watch',
    location: observation.location,
    radiusMeters: riskConfig.impacts.defaultRadiusMeters,
    eta: observation.timestamp,
    confidence: probability / 100,
    reason: {
      observationType: observation.type,
      precipitationProbability: probability,
      precipitationMm: observation.payload.precipitationMm,
    },
    status: 'active',
    validFrom: now,
    validUntil: new Date(
      new Date(observation.timestamp).getTime() +
        riskConfig.impacts.validityMinutes * 60 * 1000,
    ),
  };
}

module.exports = { qualifiesForHeavyRainImpact, buildHeavyRainImpact };
