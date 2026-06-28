import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppDevice, AppDeviceDocument } from './schemas/app-device.schema';

export type RegisterDeviceInput = {
  appInstanceId: string;
  fcmToken: string;
  platform?: string;
};

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(AppDevice.name)
    private readonly deviceModel: Model<AppDeviceDocument>,
  ) {}

  async register(input: RegisterDeviceInput) {
    return this.deviceModel.findOneAndUpdate(
      { appInstanceId: input.appInstanceId },
      {
        $set: {
          fcmToken: input.fcmToken,
          platform: input.platform || 'android',
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          appInstanceId: input.appInstanceId,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
  }

  async findByAppInstanceId(appInstanceId: string) {
    return this.deviceModel.findOne({ appInstanceId });
  }
}
