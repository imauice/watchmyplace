import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Point, PointSchema } from '../../common/schemas/point.schema';

export type WatchPlaceDocument = HydratedDocument<WatchPlace>;

@Schema({ collection: 'watch_places', timestamps: true, versionKey: false })
export class WatchPlace {
  @Prop({ type: String, required: true, trim: true, index: true })
  appInstanceId: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ type: String, default: 'other', trim: true })
  placeType: string;

  @Prop({ type: PointSchema, required: true })
  location: Point;

  @Prop({ type: Number, required: true, min: 100, max: 20000, default: 500 })
  radiusMeters: number;

  @Prop({ type: [String], default: ['weather'] })
  domains: string[];

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Boolean, default: true, index: true })
  active: boolean;
}

export const WatchPlaceSchema = SchemaFactory.createForClass(WatchPlace);
WatchPlaceSchema.index({ location: '2dsphere' });
WatchPlaceSchema.index({ appInstanceId: 1, active: 1 });
