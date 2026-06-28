import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeoService } from '../common/geo/geo.service';
import { GeoPoint } from '../common/types/geojson';
import { ObserversService } from '../observers/observers.service';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';

export type WatchPlaceLike = {
  _id: Types.ObjectId;
  location: GeoPoint;
  radiusMeters?: number;
  domains?: string[];
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly observersService: ObserversService,
    private readonly geoService: GeoService,
  ) {}

  async list() {
    return this.subscriptionModel
      .find({ isActive: true })
      .populate('observerId')
      .populate('watchPlaceId')
      .sort({ createdAt: -1 });
  }

  async createForWatchPlace(watchPlace: WatchPlaceLike) {
    const nearbyObservers = await this.observersService.findNearby(
      watchPlace.location,
      Math.max(watchPlace.radiusMeters || 500, 20000),
    );
    const globalObservers = await this.observersService.listGlobalSources();
    const observerMap = new Map<string, (typeof nearbyObservers)[number]>();
    for (const observer of [...nearbyObservers, ...globalObservers]) {
      observerMap.set(String(observer._id), observer);
    }
    const observers = [...observerMap.values()];

    const created: SubscriptionDocument[] = [];
    for (const observer of observers) {
      const distanceMeters = observer.location
        ? this.geoService.distanceMeters(
            watchPlace.location,
            observer.location as GeoPoint,
          )
        : 0;
      if (observer.location) {
        const discoveryRadius = observer.discoveryRadiusMeters || 10000;
        if (distanceMeters > discoveryRadius) continue;
      }

      const domains = watchPlace.domains?.length ? watchPlace.domains : ['weather'];
      for (const domain of domains) {
        const subscription = await this.subscriptionModel.findOneAndUpdate(
          {
            observerId: observer._id,
            watchPlaceId: watchPlace._id,
            domain,
          },
          {
            $set: {
              distanceMeters,
              isCandidate: true,
              isActive: true,
              createdBy: 'watch_place_added',
            },
          },
          { upsert: true, returnDocument: 'after', runValidators: true },
        );
        if (subscription) created.push(subscription);
      }
    }

    return created;
  }

  async findByObserverSource(source: string) {
    return this.subscriptionModel
      .find({ isActive: true })
      .populate({
        path: 'observerId',
        match: { source },
      })
      .populate('watchPlaceId');
  }
}
