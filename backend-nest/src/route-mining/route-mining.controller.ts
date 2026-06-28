import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { RouteMiningService } from './route-mining.service';

@Controller('route-relations')
export class RouteMiningController {
  constructor(private readonly routeMiningService: RouteMiningService) {}

  @Get()
  async list() {
    return { relations: await this.routeMiningService.list() };
  }

  @Post('evidence')
  async addEvidence(@Body() body: Record<string, unknown>) {
    const fromType = String(body.fromType || '').trim();
    const toType = String(body.toType || '').trim();
    const domain = String(body.domain || '').trim();

    if (!fromType || !toType || !domain) {
      throw new BadRequestException('fromType, toType and domain are required');
    }

    const relation = await this.routeMiningService.upsertEvidence({
      fromType,
      toType,
      domain,
      observedCount:
        body.observedCount === undefined ? undefined : Number(body.observedCount),
      sourceDiversity:
        body.sourceDiversity === undefined
          ? undefined
          : Number(body.sourceDiversity),
      avgDelayMinutes:
        body.avgDelayMinutes === undefined
          ? undefined
          : Number(body.avgDelayMinutes),
      avgDistanceMeters:
        body.avgDistanceMeters === undefined
          ? undefined
          : Number(body.avgDistanceMeters),
      lastSeenAt:
        body.lastSeenAt === undefined
          ? undefined
          : new Date(String(body.lastSeenAt)),
      observerReliability:
        body.observerReliability === undefined
          ? undefined
          : Number(body.observerReliability),
      isCandidate:
        body.isCandidate === undefined ? undefined : Boolean(body.isCandidate),
      isDisputed:
        body.isDisputed === undefined ? undefined : Boolean(body.isDisputed),
    });

    return { relation };
  }
}
