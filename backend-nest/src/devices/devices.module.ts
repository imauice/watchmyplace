import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { AppDevice, AppDeviceSchema } from './schemas/app-device.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppDevice.name, schema: AppDeviceSchema },
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
