export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export function isValidGeoPoint(value: unknown): value is GeoPoint {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GeoPoint;
  if (candidate.type !== 'Point') return false;
  if (!Array.isArray(candidate.coordinates) || candidate.coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = candidate.coordinates;
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}
