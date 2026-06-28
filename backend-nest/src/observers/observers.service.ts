import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoPoint } from '../common/types/geojson';
import { Observer, ObserverDocument } from './schemas/observer.schema';

export type CreateObserverInput = {
  name: string;
  kind?: string;
  source: string;
  location?: GeoPoint;
  reliability?: number;
  notifyRadiusMeters?: number;
  discoveryRadiusMeters?: number;
};

@Injectable()
export class ObserversService {
  constructor(
    @InjectModel(Observer.name)
    private readonly observerModel: Model<ObserverDocument>,
  ) {}

  async create(input: CreateObserverInput) {
    return this.observerModel.create(input);
  }

  async list() {
    return this.observerModel.find({ isActive: true }).sort({ createdAt: -1 });
  }

  async findNearby(location: GeoPoint, fallbackRadiusMeters = 10000) {
    return this.observerModel
      .find({
        isActive: true,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: fallbackRadiusMeters,
          },
        },
      })
      .limit(20);
  }

  async listGlobalSources() {
    return this.observerModel.find({
      isActive: true,
      location: { $exists: false },
      kind: { $in: ['official', 'system'] },
    });
  }

  async ensureDefaultObservers() {
    const defaults: CreateObserverInput[] = [
      {
        name: 'Open-Meteo',
        kind: 'official',
        source: 'openmeteo',
        reliability: 0.9,
        notifyRadiusMeters: 15000,
        discoveryRadiusMeters: 20000,
      },
      {
        name: 'Community',
        kind: 'community',
        source: 'community',
        reliability: 0.7,
        notifyRadiusMeters: 3000,
        discoveryRadiusMeters: 5000,
      },
      {
        name: 'System',
        kind: 'system',
        source: 'system',
        reliability: 0.8,
        notifyRadiusMeters: 5000,
        discoveryRadiusMeters: 10000,
      },
    ];

    for (const item of defaults) {
      await this.observerModel.updateOne(
        { source: item.source },
        { $setOnInsert: item },
        { upsert: true },
      );
    }
  }
}
