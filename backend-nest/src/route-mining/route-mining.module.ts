import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RouteRelation,
  RouteRelationSchema,
} from './schemas/route-relation.schema';
import { RouteMiningController } from './route-mining.controller';
import { RouteMiningService } from './route-mining.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RouteRelation.name, schema: RouteRelationSchema },
    ]),
  ],
  controllers: [RouteMiningController],
  providers: [RouteMiningService],
  exports: [RouteMiningService],
})
export class RouteMiningModule {}
