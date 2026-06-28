import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health/health.controller';
import { DevicesModule } from './devices/devices.module';
import { WatchPlacesModule } from './watch-places/watch-places.module';
import { ObservationsModule } from './observations/observations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ObserversModule } from './observers/observers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RouteMiningModule } from './route-mining/route-mining.module';
import { ImpactsModule } from './impacts/impacts.module';
import { OpenMeteoModule } from './open-meteo/open-meteo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/watchmyplace',
      }),
    }),
    FirebaseModule,
    DevicesModule,
    ObserversModule,
    SubscriptionsModule,
    RouteMiningModule,
    ImpactsModule,
    OpenMeteoModule,
    WatchPlacesModule,
    ObservationsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
