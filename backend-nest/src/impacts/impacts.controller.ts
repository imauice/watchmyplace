import { Controller, Get, Post } from '@nestjs/common';
import { ImpactsService } from './impacts.service';

@Controller('impacts')
export class ImpactsController {
  constructor(private readonly impactsService: ImpactsService) {}

  @Get('active')
  async active() {
    return { impacts: await this.impactsService.findActive() };
  }

  @Post('run-once')
  async runOnce() {
    return { impact: await this.impactsService.runHeavyRainImpactWorker() };
  }
}
