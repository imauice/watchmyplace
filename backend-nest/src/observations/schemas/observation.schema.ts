import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Point, PointSchema } from '../../common/schemas/point.schema';

export type ObservationDocument = HydratedDocument<Observation>;

@Schema({ _id: false })
export class ObservationSource {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true })
  externalId?: string;
}

export const ObservationSourceSchema =
  SchemaFactory.createForClass(ObservationSource);

@Schema({
  collection: 'observations',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class Observation {
  @Prop({ type: String, required: true, trim: true, index: true })
  type: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  domain: string;

  @Prop({ type: ObservationSourceSchema, required: true })
  source: ObservationSource;

  @Prop({ type: Types.ObjectId, ref: 'Observer', index: true })
  observerId?: Types.ObjectId;

  @Prop({ type: PointSchema, required: true })
  location: Point;

  @Prop({ type: Date, required: true, index: true })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: Number, min: 0, max: 1, default: 1 })
  confidence: number;

  @Prop({ type: Number, min: 0, max: 1 })
  severity?: number;

  createdAt: Date;
}

export const ObservationSchema = SchemaFactory.createForClass(Observation);
ObservationSchema.index({ location: '2dsphere' });
ObservationSchema.index({ type: 1, timestamp: -1 });
ObservationSchema.index({ observerId: 1, timestamp: -1 });
ObservationSchema.index(
  { 'source.name': 1, 'source.externalId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'source.externalId': { $type: 'string' } },
  },
);
