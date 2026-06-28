import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ collection: 'subscriptions', timestamps: true, versionKey: false })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Observer', required: true, index: true })
  observerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WatchPlace', required: true, index: true })
  watchPlaceId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  distanceMeters: number;

  @Prop({ type: String, default: 'weather', trim: true })
  domain: string;

  @Prop({ type: Boolean, default: true })
  isCandidate: boolean;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: ['watch_place_added', 'observer_added', 'system'],
    default: 'system',
  })
  createdBy: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index(
  { observerId: 1, watchPlaceId: 1, domain: 1 },
  { unique: true },
);
