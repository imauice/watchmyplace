const riskConfig = require('../config/risk');

function groupWatchPlaces(places) {
  const precision = riskConfig.openMeteo.groupingPrecision;
  const groups = new Map();

  for (const place of places) {
    const [lng, lat] = place.location.coordinates;
    const key = `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(place);
  }

  return [...groups.values()];
}

async function fetchForecast(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set(
    'hourly',
    'precipitation,precipitation_probability,rain',
  );
  url.searchParams.set('forecast_hours', riskConfig.openMeteo.forecastHours);
  url.searchParams.set('timezone', 'GMT');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status})`);
  }
  return response.json();
}

function normalizeForecast(forecast, location) {
  const hourly = forecast.hourly;
  if (!hourly?.time) return [];

  return hourly.time.map((time, index) => {
    const probability = hourly.precipitation_probability?.[index] ?? 0;
    const precipitationMm = hourly.precipitation?.[index] ?? 0;
    const isHeavyRain =
      probability >= riskConfig.openMeteo.heavyRainProbability &&
      precipitationMm >= riskConfig.openMeteo.heavyRainPrecipitationMm;
    const timestamp = new Date(time.endsWith('Z') ? time : `${time}Z`);

    return {
      type: isHeavyRain
        ? 'weather.heavy_rain_forecast'
        : 'weather.precipitation_forecast',
      domain: 'weather',
      source: {
        name: 'openmeteo',
        externalId: [
          location[1].toFixed(4),
          location[0].toFixed(4),
          timestamp.toISOString(),
        ].join(':'),
      },
      location: { type: 'Point', coordinates: location },
      timestamp,
      payload: {
        precipitationMm,
        rainMm: hourly.rain?.[index] ?? 0,
        precipitationProbability: probability,
        forecastGeneratedAt: new Date().toISOString(),
      },
      confidence: probability / 100,
    };
  });
}

module.exports = { groupWatchPlaces, fetchForecast, normalizeForecast };
