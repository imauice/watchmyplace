const assert = require('node:assert/strict');
const test = require('node:test');
const {
  qualifiesForHeavyRainImpact,
  buildHeavyRainImpact,
} = require('../src/services/impact.service');

test('heavy-rain observation inside three hours creates an impact', () => {
  const now = new Date('2026-06-21T00:00:00Z');
  const observation = {
    _id: 'observation-id',
    type: 'weather.heavy_rain_forecast',
    timestamp: new Date('2026-06-21T02:00:00Z'),
    location: { type: 'Point', coordinates: [98.9853, 18.7883] },
    payload: {
      precipitationProbability: 85,
      precipitationMm: 12,
    },
  };

  assert.equal(qualifiesForHeavyRainImpact(observation, now), true);
  const impact = buildHeavyRainImpact(observation, now);
  assert.equal(impact.domain, 'weather');
  assert.equal(impact.severity, 'watch');
  assert.equal(impact.confidence, 0.85);
});

test('forecast beyond three hours does not qualify', () => {
  const now = new Date('2026-06-21T00:00:00Z');
  const observation = {
    type: 'weather.heavy_rain_forecast',
    timestamp: new Date('2026-06-21T04:00:00Z'),
    payload: { precipitationProbability: 95 },
  };
  assert.equal(qualifiesForHeavyRainImpact(observation, now), false);
});
