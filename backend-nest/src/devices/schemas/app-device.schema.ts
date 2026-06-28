import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppDeviceDocument = HydratedDocument<AppDevice>;

@Schema({
  collection: 'app_devices',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AppDevice {
  @Prop({ type: String, required: true, unique: true, trim: true })
  appInstanceId: string;

  @Prop({ type: String, required: true, trim: true })
  fcmToken: string;

  @Prop({ type: String, default: 'android', trim: true })
  platform: string;

  @Prop({ type: Date, required: true, default: Date.now })
  lastSeenAt: Date;

  createdAt: Date;
}

export const AppDeviceSchema = SchemaFactory.createForClass(AppDevice);
