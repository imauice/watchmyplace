const assert = require('node:assert/strict');
const test = require('node:test');
const { haversineMeters, areasIntersect } = require('../src/services/geo.service');

test('haversineMeters returns zero for the same point', () => {
  assert.equal(haversineMeters([98.9853, 18.7883], [98.9853, 18.7883]), 0);
});

test('areasIntersect combines impact and watch-place radii', () => {
  const impact = {
    location: { coordinates: [98.9853, 18.7883] },
    radiusMeters: 500,
  };
  const place = {
    location: { coordinates: [98.9900, 18.7883] },
    radiusMeters: 100,
  };
  assert.equal(areasIntersect(impact, place), true);
});
