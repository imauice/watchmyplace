import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() body: Record<string, unknown>) {
    const appInstanceId = String(body.appInstanceId || '').trim();
    const fcmToken = String(body.fcmToken || '').trim();
    const platform = String(body.platform || 'android').trim();

    if (!appInstanceId || !fcmToken) {
      throw new BadRequestException('appInstanceId and fcmToken are required');
    }

    const device = await this.devicesService.register({
      appInstanceId,
      fcmToken,
      platform,
    });

    return {
      registered: true,
      device: {
        appInstanceId: device?.appInstanceId,
        platform: device?.platform,
        createdAt: device?.createdAt,
        lastSeenAt: device?.lastSeenAt,
      },
    };
  }
}
