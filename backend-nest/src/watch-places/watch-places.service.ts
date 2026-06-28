import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoPoint } from '../common/types/geojson';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WatchPlace, WatchPlaceDocument } from './schemas/watch-place.schema';

export type CreateWatchPlaceInput = {
  appInstanceId: string;
  name: string;
  placeType?: string;
  location: GeoPoint;
  radiusMeters?: number;
  domains?: string[];
  address?: string;
  note?: string;
};

@Injectable()
export class WatchPlacesService {
  constructor(
    @InjectModel(WatchPlace.name)
    private readonly watchPlaceModel: Model<WatchPlaceDocument>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(input: CreateWatchPlaceInput) {
    const place = await this.watchPlaceModel.create({
      ...input,
      radiusMeters: input.radiusMeters || 500,
      domains: input.domains?.length ? input.domains : ['weather'],
      active: true,
    });

    const subscriptions =
      await this.subscriptionsService.createForWatchPlace(place);

    return { place, subscriptionsCreated: subscriptions.length };
  }

  async list(appInstanceId: string) {
    return this.watchPlaceModel
      .find({ appInstanceId, active: true })
      .sort({ createdAt: -1 });
  }

  async listActiveByDomain(domain: string) {
    return this.watchPlaceModel.find({
      active: true,
      domains: domain,
    });
  }

  async findActiveNear(input: {
    domain: string;
    location: GeoPoint;
    maxDistanceMeters: number;
  }) {
    return this.watchPlaceModel.find({
      active: true,
      domains: input.domain,
      location: {
        $near: {
          $geometry: input.location,
          $maxDistance: input.maxDistanceMeters,
        },
      },
    });
  }

  async update(id: string, appInstanceId: string, updates: Record<string, unknown>) {
    const place = await this.watchPlaceModel.findOneAndUpdate(
      { _id: id, appInstanceId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    );
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  async remove(id: string, appInstanceId: string) {
    const place = await this.watchPlaceModel.findOneAndDelete({
      _id: id,
      appInstanceId,
    });
    if (!place) throw new NotFoundException('Place not found');
  }
}
