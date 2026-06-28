import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Observation, ObservationSchema } from '../observations/schemas/observation.schema';
import { Impact, ImpactSchema } from './schemas/impact.schema';
import { ImpactsController } from './impacts.controller';
import { ImpactsService } from './impacts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Impact.name, schema: ImpactSchema },
      { name: Observation.name, schema: ObservationSchema },
    ]),
  ],
  controllers: [ImpactsController],
  providers: [ImpactsService],
  exports: [ImpactsService, MongooseModule],
})
export class ImpactsModule {}
