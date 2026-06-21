const WatchPlace = require('../models/WatchPlace');
const { createObservation } = require('../services/observation.service');
const {
  groupWatchPlaces,
  fetchForecast,
  normalizeForecast,
} = require('../services/openMeteo.service');

async function runOpenMeteoWorker() {
  const places = await WatchPlace.find({
    active: true,
    domains: 'weather',
  }).lean();
  const groups = groupWatchPlaces(places);
  let stored = 0;

  for (const group of groups) {
    const [longitude, latitude] = group[0].location.coordinates;
    const forecast = await fetchForecast(latitude, longitude);
    const observations = normalizeForecast(forecast, [longitude, latitude]);
    for (const observation of observations) {
      const saved = await createObservation(observation);
      if (saved) stored += 1;
    }
  }

  return { places: places.length, groups: groups.length, stored };
}

module.exports = { runOpenMeteoWorker };
