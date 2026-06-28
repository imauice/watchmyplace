import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeoService } from '../common/geo/geo.service';
import { riskConfig } from '../config/risk.config';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { DevicesService } from '../devices/devices.service';
import { ImpactsService } from '../impacts/impacts.service';
import { ImpactDocument } from '../impacts/schemas/impact.schema';
import { WatchPlacesService } from '../watch-places/watch-places.service';
import { WatchPlaceDocument } from '../watch-places/schemas/watch-place.schema';
import {
  NotificationLog,
  NotificationLogDocument,
} from './schemas/notification-log.schema';

type FirebaseAppLike = {
  messaging: () => {
    send: (message: Record<string, unknown>) => Promise<string>;
  };
};

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(FIREBASE_ADMIN)
    private readonly firebaseApp: FirebaseAppLike | null,
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
    private readonly devicesService: DevicesService,
    private readonly impactsService: ImpactsService,
    private readonly watchPlacesService: WatchPlacesService,
    private readonly geoService: GeoService,
  ) {}

  async sendToToken(input: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin is not configured');
    }

    return this.firebaseApp.messaging().send({
      token: input.token,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'watchmyplace_alerts',
          sound: 'default',
        },
      },
    });
  }

  async log(input: Partial<NotificationLog>) {
    return this.notificationLogModel.create(input);
  }

  messageForImpact(impact: ImpactDocument, place: WatchPlaceDocument) {
    const etaMinutes = Math.max(
      0,
      Math.round((new Date(impact.eta).getTime() - Date.now()) / 60000),
    );
    return {
      title: `WatchMyPlace · ${place.name}`,
      body:
        etaMinutes > 0
          ? `มีโอกาสฝนตกหนักใกล้สถานที่นี้ภายใน ${etaMinutes} นาที`
          : 'มีโอกาสฝนตกหนักใกล้สถานที่นี้ โปรดติดตามสถานการณ์',
    };
  }

  async findMatchedPlaces(impact: ImpactDocument) {
    const candidates = await this.watchPlacesService.findActiveNear({
      domain: impact.domain,
      location: impact.location,
      maxDistanceMeters: impact.radiusMeters + 20000,
    });

    return candidates.filter((place) =>
      this.geoService.areasIntersect(
        { location: impact.location, radiusMeters: impact.radiusMeters },
        { location: place.location, radiusMeters: place.radiusMeters },
      ),
    );
  }

  async runImpactNotificationWorker(now = new Date()) {
    const impacts = await this.impactsService.findActive(now);
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const impact of impacts) {
      const places = await this.findMatchedPlaces(impact);
      for (const place of places) {
        const dedupeKey = `impact:${String(impact._id)}:place:${String(place._id)}`;
        const existing = await this.notificationLogModel.findOne({ dedupeKey });
        if (existing) {
          skipped += 1;
          continue;
        }

        const cooldownFrom = new Date(
          now.getTime() - riskConfig.notifications.cooldownMinutes * 60000,
        );
        const recent = await this.notificationLogModel.findOne({
          watchPlaceId: place._id as Types.ObjectId,
          alertType: impact.type,
          status: 'sent',
          createdAt: { $gte: cooldownFrom },
        });
        const message = this.messageForImpact(impact, place);

        if (recent) {
          await this.log({
            appInstanceId: place.appInstanceId,
            watchPlaceId: place._id as Types.ObjectId,
            impactId: impact._id as Types.ObjectId,
            kind: 'impact_alert',
            status: 'skipped',
            reason: 'cooldown',
            alertType: impact.type,
            severity: impact.severity,
            ...message,
            dedupeKey,
          });
          skipped += 1;
          continue;
        }

        const device = await this.devicesService.findByAppInstanceId(
          place.appInstanceId,
        );
        if (!device) {
          await this.log({
            appInstanceId: place.appInstanceId,
            watchPlaceId: place._id as Types.ObjectId,
            impactId: impact._id as Types.ObjectId,
            kind: 'impact_alert',
            status: 'failed',
            reason: 'device_not_registered',
            alertType: impact.type,
            severity: impact.severity,
            ...message,
            dedupeKey,
          });
          failed += 1;
          continue;
        }

        try {
          const messageId = await this.sendToToken({
            token: device.fcmToken,
            ...message,
            data: {
              type: 'impact_alert',
              impactId: String(impact._id),
              placeId: String(place._id),
              severity: impact.severity,
            },
          });
          await this.log({
            appInstanceId: place.appInstanceId,
            watchPlaceId: place._id as Types.ObjectId,
            impactId: impact._id as Types.ObjectId,
            kind: 'impact_alert',
            status: 'sent',
            alertType: impact.type,
            severity: impact.severity,
            messageId,
            ...message,
            dedupeKey,
          });
          sent += 1;
        } catch (error: any) {
          await this.log({
            appInstanceId: place.appInstanceId,
            watchPlaceId: place._id as Types.ObjectId,
            impactId: impact._id as Types.ObjectId,
            kind: 'impact_alert',
            status: 'failed',
            reason: error?.message || 'send_failed',
            alertType: impact.type,
            severity: impact.severity,
            ...message,
            dedupeKey,
          });
          failed += 1;
        }
      }
    }

    return { impacts: impacts.length, sent, skipped, failed };
  }
}
