import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoPoint } from '../common/types/geojson';
import {
  Observation,
  ObservationDocument,
} from './schemas/observation.schema';

export type CreateObservationInput = {
  type: string;
  domain: string;
  source: { name: string; externalId?: string };
  observerId?: string;
  location: GeoPoint;
  timestamp: Date;
  payload?: Record<string, unknown>;
  confidence?: number;
  severity?: number;
};

export type NearbyObservationInput = {
  location: [number, number];
  radiusMeters: number;
  fromTime?: string;
  toTime?: string;
  types?: string[];
  source?: string;
  limit?: number;
};

type ObservationFilter = Record<string, any>;

@Injectable()
export class ObservationsService {
  constructor(
    @InjectModel(Observation.name)
    private readonly observationModel: Model<ObservationDocument>,
  ) {}

  async create(input: CreateObservationInput) {
    return this.observationModel.create(input);
  }

  async findNearby(input: NearbyObservationInput) {
    const filter: ObservationFilter = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: input.location,
          },
          $maxDistance: input.radiusMeters,
        },
      },
    };

    this.applyCommonFilters(filter, input);

    return this.observationModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(input.limit || 100, 500));
  }

  async findTimeWindow(input: Omit<NearbyObservationInput, 'location' | 'radiusMeters'>) {
    const filter: ObservationFilter = {};
    this.applyCommonFilters(filter, input);
    return this.observationModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(input.limit || 100, 500));
  }

  private applyCommonFilters(
    filter: ObservationFilter,
    input: {
      fromTime?: string;
      toTime?: string;
      types?: string[];
      source?: string;
    },
  ) {
    if (input.fromTime || input.toTime) {
      filter.timestamp = {};
      if (input.fromTime) filter.timestamp.$gte = new Date(input.fromTime);
      if (input.toTime) filter.timestamp.$lte = new Date(input.toTime);
    }
    if (input.types?.length) {
      filter.type = { $in: input.types };
    }
    if (input.source) {
      filter['source.name'] = input.source;
    }
  }
}
