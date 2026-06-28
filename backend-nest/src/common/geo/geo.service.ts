import { Injectable } from '@nestjs/common';
import { GeoPoint } from '../types/geojson';

@Injectable()
export class GeoService {
  distanceMeters(a: GeoPoint, b: GeoPoint): number {
    const [lng1, lat1] = a.coordinates;
    const [lng2, lat2] = b.coordinates;
    const earthRadiusMeters = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
    return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
  }

  areasIntersect(
    a: { location: GeoPoint; radiusMeters: number },
    b: { location: GeoPoint; radiusMeters: number },
  ): boolean {
    return (
      this.distanceMeters(a.location, b.location) <=
      a.radiusMeters + b.radiusMeters
    );
  }
}
