import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from '../devices/devices.module';
import { GeoService } from '../common/geo/geo.service';
import { ImpactsModule } from '../impacts/impacts.module';
import { WatchPlacesModule } from '../watch-places/watch-places.module';
import { NotifyController } from './notify.controller';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    DevicesModule,
    ImpactsModule,
    WatchPlacesModule,
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [NotifyController],
  providers: [NotificationsService, GeoService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
