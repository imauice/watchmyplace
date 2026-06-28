import { Module } from '@nestjs/common';
import { ObservationsModule } from '../observations/observations.module';
import { WatchPlacesModule } from '../watch-places/watch-places.module';
import { OpenMeteoController } from './open-meteo.controller';
import { OpenMeteoService } from './open-meteo.service';

@Module({
  imports: [WatchPlacesModule, ObservationsModule],
  controllers: [OpenMeteoController],
  providers: [OpenMeteoService],
  exports: [OpenMeteoService],
})
export class OpenMeteoModule {}
