import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { isValidGeoPoint } from '../common/types/geojson';
import { WatchPlacesService } from './watch-places.service';

function parseDomains(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item).trim()).filter(Boolean);
}

@Controller(['watch-places', 'v1/watch-places'])
export class WatchPlacesController {
  constructor(private readonly watchPlacesService: WatchPlacesService) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const appInstanceId = String(body.appInstanceId || '').trim();
    const name = String(body.name || '').trim();
    if (!appInstanceId || !name || !isValidGeoPoint(body.location)) {
      throw new BadRequestException(
        'appInstanceId, name and location are required',
      );
    }

    const result = await this.watchPlacesService.create({
      appInstanceId,
      name,
      placeType: String(body.placeType || 'other'),
      location: body.location,
      radiusMeters:
        body.radiusMeters === undefined ? undefined : Number(body.radiusMeters),
      domains: parseDomains(body.domains),
      address: body.address === undefined ? undefined : String(body.address),
      note: body.note === undefined ? undefined : String(body.note),
    });

    return result;
  }

  @Get()
  async list(@Query('appInstanceId') appInstanceId?: string) {
    if (!appInstanceId) {
      throw new BadRequestException('appInstanceId is required');
    }
    return { places: await this.watchPlacesService.list(appInstanceId) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const appInstanceId = String(body.appInstanceId || '').trim();
    if (!appInstanceId) {
      throw new BadRequestException('appInstanceId is required');
    }
    const updates = { ...body };
    delete updates.appInstanceId;
    const place = await this.watchPlacesService.update(id, appInstanceId, updates);
    return { place };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @Query('appInstanceId') appInstanceId?: string,
  ) {
    if (!appInstanceId) {
      throw new BadRequestException('appInstanceId is required');
    }
    await this.watchPlacesService.remove(id, appInstanceId);
  }
}
