import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WatchPlace, WatchPlaceSchema } from './schemas/watch-place.schema';
import { WatchPlacesController } from './watch-places.controller';
import { WatchPlacesService } from './watch-places.service';

@Module({
  imports: [
    SubscriptionsModule,
    MongooseModule.forFeature([
      { name: WatchPlace.name, schema: WatchPlaceSchema },
    ]),
  ],
  controllers: [WatchPlacesController],
  providers: [WatchPlacesService],
  exports: [WatchPlacesService, MongooseModule],
})
export class WatchPlacesModule {}
