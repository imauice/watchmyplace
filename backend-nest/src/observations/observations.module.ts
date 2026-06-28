import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Observation, ObservationSchema } from './schemas/observation.schema';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Observation.name, schema: ObservationSchema },
    ]),
  ],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService, MongooseModule],
})
export class ObservationsModule {}
