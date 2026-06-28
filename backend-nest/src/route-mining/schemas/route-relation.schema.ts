import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RouteRelationDocument = HydratedDocument<RouteRelation>;

@Schema({ collection: 'route_relations', timestamps: true, versionKey: false })
export class RouteRelation {
  @Prop({ type: String, required: true, trim: true })
  fromType: string;

  @Prop({ type: String, required: true, trim: true })
  toType: string;

  @Prop({ type: String, required: true, trim: true, default: 'weather' })
  domain: string;

  @Prop({ type: Number, min: 0, default: 0 })
  observedCount: number;

  @Prop({ type: Number, min: 1, default: 1 })
  sourceDiversity: number;

  @Prop({ type: Number, min: 0, default: 0 })
  avgDelayMinutes: number;

  @Prop({ type: Number, min: 0, default: 0 })
  avgDistanceMeters: number;

  @Prop({ type: Date, default: Date.now })
  lastSeenAt: Date;

  @Prop({ type: Number, min: 0, max: 1, default: 0.7 })
  observerReliability: number;

  @Prop({ type: Number, min: 0, max: 1, default: 0 })
  confidence: number;

  @Prop({ type: Boolean, default: true })
  isCandidate: boolean;

  @Prop({ type: Boolean, default: false })
  isDisputed: boolean;
}

export const RouteRelationSchema =
  SchemaFactory.createForClass(RouteRelation);

RouteRelationSchema.index(
  { fromType: 1, toType: 1, domain: 1 },
  { unique: true },
);
RouteRelationSchema.index({ confidence: -1 });
RouteRelationSchema.index({ lastSeenAt: -1 });
