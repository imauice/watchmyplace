import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Point, PointSchema } from '../../common/schemas/point.schema';

export type ImpactDocument = HydratedDocument<Impact>;

@Schema({
  collection: 'impacts',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class Impact {
  @Prop({ type: Types.ObjectId, ref: 'Observation', required: true })
  sourceObservationId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  type: string;

  @Prop({ type: String, required: true, trim: true })
  domain: string;

  @Prop({
    type: String,
    enum: ['watch', 'warning', 'critical'],
    required: true,
  })
  severity: string;

  @Prop({ type: PointSchema, required: true })
  location: Point;

  @Prop({ type: Number, required: true, min: 1 })
  radiusMeters: number;

  @Prop({ type: Date, required: true })
  eta: Date;

  @Prop({ type: Number, required: true, min: 0, max: 1 })
  confidence: number;

  @Prop({ type: Object, required: true })
  reason: Record<string, unknown>;

  @Prop({
    type: String,
    enum: ['active', 'expired', 'resolved'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ type: Date, required: true })
  validFrom: Date;

  @Prop({ type: Date, required: true, index: true })
  validUntil: Date;

  createdAt: Date;
}

export const ImpactSchema = SchemaFactory.createForClass(Impact);
ImpactSchema.index({ location: '2dsphere' });
ImpactSchema.index({ sourceObservationId: 1, type: 1 }, { unique: true });
