import { Injectable } from '@nestjs/common';
import { riskConfig } from '../config/risk.config';
import { ObservationsService } from '../observations/observations.service';
import { WatchPlacesService } from '../watch-places/watch-places.service';
import { WatchPlaceDocument } from '../watch-places/schemas/watch-place.schema';

type OpenMeteoForecast = {
  hourly?: {
    time?: string[];
    precipitation?: number[];
    precipitation_probability?: number[];
    rain?: number[];
  };
};

@Injectable()
export class OpenMeteoService {
  constructor(
    private readonly watchPlacesService: WatchPlacesService,
    private readonly observationsService: ObservationsService,
  ) {}

  groupWatchPlaces(places: WatchPlaceDocument[]) {
    const precision = riskConfig.openMeteo.groupingPrecision;
    const groups = new Map<string, WatchPlaceDocument[]>();

    for (const place of places) {
      const [lng, lat] = place.location.coordinates;
      const key = `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(place);
    }

    return [...groups.values()];
  }

  async fetchForecast(latitude: number, longitude: number) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set(
      'hourly',
      'precipitation,precipitation_probability,rain',
    );
    url.searchParams.set(
      'forecast_hours',
      String(riskConfig.openMeteo.forecastHours),
    );
    url.searchParams.set('timezone', 'GMT');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed (${response.status})`);
    }
    return (await response.json()) as OpenMeteoForecast;
  }

  normalizeForecast(forecast: OpenMeteoForecast, location: [number, number]) {
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
        location: { type: 'Point' as const, coordinates: location },
        timestamp,
        payload: {
          precipitationMm,
          rainMm: hourly.rain?.[index] ?? 0,
          precipitationProbability: probability,
          forecastGeneratedAt: new Date().toISOString(),
        },
        confidence: probability / 100,
        severity: Math.min(1, precipitationMm / 50),
      };
    });
  }

  async runOnce() {
    const places = await this.watchPlacesService.listActiveByDomain('weather');
    const groups = this.groupWatchPlaces(places);
    let stored = 0;
    let duplicated = 0;

    for (const group of groups) {
      const [longitude, latitude] = group[0].location.coordinates;
      const forecast = await this.fetchForecast(latitude, longitude);
      const observations = this.normalizeForecast(forecast, [
        longitude,
        latitude,
      ]);

      for (const observation of observations) {
        try {
          await this.observationsService.create(observation);
          stored += 1;
        } catch (error: any) {
          if (error?.code === 11000) duplicated += 1;
          else throw error;
        }
      }
    }

    return {
      places: places.length,
      groups: groups.length,
      stored,
      duplicated,
    };
  }
}
