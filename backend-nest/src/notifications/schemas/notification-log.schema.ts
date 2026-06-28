import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

@Schema({
  collection: 'notification_logs',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class NotificationLog {
  @Prop({ type: String, required: true, trim: true, index: true })
  appInstanceId: string;

  @Prop({ type: Types.ObjectId, ref: 'WatchPlace', index: true })
  watchPlaceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Impact', index: true })
  impactId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Observation', index: true })
  observationId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['observation_delivery', 'impact_alert', 'test'],
    default: 'test',
  })
  kind: string;

  @Prop({
    type: String,
    enum: ['sent', 'skipped', 'failed'],
    required: true,
  })
  status: string;

  @Prop({ type: String, trim: true })
  reason?: string;

  @Prop({ type: String, trim: true })
  title?: string;

  @Prop({ type: String, trim: true })
  body?: string;

  @Prop({ type: String, trim: true })
  messageId?: string;

  @Prop({ type: String, trim: true })
  alertType?: string;

  @Prop({ type: String, trim: true })
  severity?: string;

  @Prop({ type: String, trim: true, unique: true, sparse: true })
  dedupeKey?: string;

  createdAt: Date;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);
NotificationLogSchema.index({ appInstanceId: 1, createdAt: -1 });
NotificationLogSchema.index({ watchPlaceId: 1, kind: 1, createdAt: -1 });
NotificationLogSchema.index({ watchPlaceId: 1, alertType: 1, status: 1, createdAt: -1 });
