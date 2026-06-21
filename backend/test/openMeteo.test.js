const assert = require('node:assert/strict');
const test = require('node:test');
const {
  groupWatchPlaces,
  normalizeForecast,
} = require('../src/services/openMeteo.service');

test('nearby watch places are grouped for API efficiency', () => {
  const places = [
    { location: { coordinates: [98.98531, 18.78831] } },
    { location: { coordinates: [98.98532, 18.78832] } },
    { location: { coordinates: [99.105, 18.762] } },
  ];
  assert.equal(groupWatchPlaces(places).length, 2);
});

test('forecast normalizes into heavy-rain observation', () => {
  const forecast = {
    hourly: {
      time: ['2026-06-21T02:00'],
      precipitation_probability: [85],
      precipitation: [12],
      rain: [10],
    },
  };
  const observations = normalizeForecast(forecast, [98.9853, 18.7883]);
  assert.equal(observations[0].type, 'weather.heavy_rain_forecast');
  assert.equal(observations[0].confidence, 0.85);
  assert.equal(
    observations[0].timestamp.toISOString(),
    '2026-06-21T02:00:00.000Z',
  );
});
