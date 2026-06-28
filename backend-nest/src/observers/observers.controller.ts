import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { isValidGeoPoint } from '../common/types/geojson';
import { ObserversService } from './observers.service';

@Controller('observers')
export class ObserversController {
  constructor(private readonly observersService: ObserversService) {}

  @Get()
  async list() {
    return { observers: await this.observersService.list() };
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const name = String(body.name || '').trim();
    const source = String(body.source || '').trim();
    if (!name || !source) {
      throw new BadRequestException('name and source are required');
    }
    if (body.location !== undefined && !isValidGeoPoint(body.location)) {
      throw new BadRequestException('location must be a GeoJSON Point');
    }

    const observer = await this.observersService.create({
      name,
      source,
      kind: String(body.kind || 'system'),
      location: body.location,
      reliability:
        body.reliability === undefined ? undefined : Number(body.reliability),
      notifyRadiusMeters:
        body.notifyRadiusMeters === undefined
          ? undefined
          : Number(body.notifyRadiusMeters),
      discoveryRadiusMeters:
        body.discoveryRadiusMeters === undefined
          ? undefined
          : Number(body.discoveryRadiusMeters),
    });

    return { observer };
  }
}
