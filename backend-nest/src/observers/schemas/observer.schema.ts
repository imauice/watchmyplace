import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Point, PointSchema } from '../../common/schemas/point.schema';

export type ObserverDocument = HydratedDocument<Observer>;

@Schema({ collection: 'observers', timestamps: true, versionKey: false })
export class Observer {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: ['official', 'physical', 'community', 'indirect', 'system'],
    default: 'system',
    index: true,
  })
  kind: string;

  @Prop({ type: String, required: true, trim: true })
  source: string;

  @Prop({ type: PointSchema })
  location?: Point;

  @Prop({ type: Number, min: 0, max: 1, default: 0.7 })
  reliability: number;

  @Prop({ type: Number, min: 100, max: 100000, default: 5000 })
  notifyRadiusMeters: number;

  @Prop({ type: Number, min: 100, max: 100000, default: 10000 })
  discoveryRadiusMeters: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;
}

export const ObserverSchema = SchemaFactory.createForClass(Observer);
ObserverSchema.index({ location: '2dsphere' });
ObserverSchema.index({ source: 1 }, { unique: true });
