import { Controller, Post } from '@nestjs/common';
import { OpenMeteoService } from './open-meteo.service';

@Controller('workers/open-meteo')
export class OpenMeteoController {
  constructor(private readonly openMeteoService: OpenMeteoService) {}

  @Post('run-once')
  async runOnce() {
    return { openMeteo: await this.openMeteoService.runOnce() };
  }
}
