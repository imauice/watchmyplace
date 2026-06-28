import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { NotificationsService } from './notifications.service';

@Controller('notify')
export class NotifyController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('test')
  async test(@Body() body: Record<string, unknown>) {
    const appInstanceId = String(body.appInstanceId || '').trim();
    if (!appInstanceId) {
      throw new BadRequestException('appInstanceId is required');
    }

    const device = await this.devicesService.findByAppInstanceId(appInstanceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const messageId = await this.notificationsService.sendToToken({
      token: device.fcmToken,
      title: 'WatchMyPlace',
      body: 'ระบบพร้อมเฝ้าสถานที่ของคุณแล้ว',
      data: {
        type: 'test',
      },
    });

    await this.notificationsService.log({
      appInstanceId,
      kind: 'test',
      status: 'sent',
      dedupeKey: `test:${appInstanceId}:${Date.now()}`,
    });

    return { sent: true, messageId };
  }

  @Post('run-once')
  async runOnce() {
    return {
      notification: await this.notificationsService.runImpactNotificationWorker(),
    };
  }
}
