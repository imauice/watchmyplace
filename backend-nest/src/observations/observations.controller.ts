import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { isValidGeoPoint } from '../common/types/geojson';
import { ObservationsService } from './observations.service';

function splitCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

@Controller(['observations', 'v1/observations'])
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const type = String(body.type || '').trim();
    const domain = String(body.domain || '').trim();
    const timestamp = body.timestamp || body.observedAt;
    const source = body.source as { name?: unknown; externalId?: unknown };

    if (
      !type ||
      !domain ||
      !source ||
      !String(source.name || '').trim() ||
      !isValidGeoPoint(body.location) ||
      !timestamp
    ) {
      throw new BadRequestException(
        'type, domain, source, location and timestamp are required',
      );
    }

    const observation = await this.observationsService.create({
      type,
      domain,
      source: {
        name: String(source.name).trim(),
        externalId:
          source.externalId === undefined
            ? undefined
            : String(source.externalId).trim(),
      },
      observerId:
        body.observerId === undefined ? undefined : String(body.observerId),
      location: body.location,
      timestamp: new Date(String(timestamp)),
      payload:
        body.payload && typeof body.payload === 'object'
          ? (body.payload as Record<string, unknown>)
          : {},
      confidence:
        body.confidence === undefined ? undefined : Number(body.confidence),
      severity: body.severity === undefined ? undefined : Number(body.severity),
    });

    return { observation };
  }

  @Get('nearby')
  async nearby(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusMeters') radiusMeters = '5000',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('types') types?: string,
    @Query('source') source?: string,
    @Query('limit') limit = '100',
  ) {
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException('lat and lng are required');
    }

    return {
      observations: await this.observationsService.findNearby({
        location: [Number(lng), Number(lat)],
        radiusMeters: Number(radiusMeters),
        fromTime: from,
        toTime: to,
        types: splitCsv(types),
        source,
        limit: Number(limit),
      }),
    };
  }

  @Get('window')
  async window(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('types') types?: string,
    @Query('source') source?: string,
    @Query('limit') limit = '100',
  ) {
    if (!from || !to) {
      throw new BadRequestException('from and to are required');
    }

    return {
      observations: await this.observationsService.findTimeWindow({
        fromTime: from,
        toTime: to,
        types: splitCsv(types),
        source,
        limit: Number(limit),
      }),
    };
  }
}
