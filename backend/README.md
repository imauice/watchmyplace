# WatchMyPlace Backend

Node.js, Express, MongoDB and Firebase backend for the first place-first
Observation pipeline.

## Implemented pipeline

```text
Watch Places
→ Open-Meteo Worker
→ Observations
→ Impact Worker
→ Place Matcher
→ Notification Worker
→ Firebase Cloud Messaging
→ Notification Log
```

This implementation intentionally uses deterministic rules. It does not use AI,
machine learning, a graph database or pattern mining.

## Requirements

- Node.js 20 or newer
- MongoDB
- Firebase project and Admin SDK service account

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Configure `.env`:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/watchmyplace
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
OPEN_METEO_INTERVAL_MINUTES=60
IMPACT_INTERVAL_MINUTES=5
NOTIFICATION_INTERVAL_MINUTES=1
```

Place the Firebase Admin credential at `service-account.json`. Both files are
ignored by Git.

## Run

Run the API:

```powershell
npm run dev
```

Run each replaceable worker in a separate terminal:

```powershell
npm run worker:open-meteo
npm run worker:impact
npm run worker:notification
```

Run the complete pipeline once:

```powershell
npm run pipeline:once
```

Individual one-shot workers are also available:

```powershell
npm run worker:open-meteo:once
npm run worker:impact:once
npm run worker:notification:once
```

## API

### Health

```http
GET /health
```

### Register a device

```http
POST /devices/register
Content-Type: application/json

{
  "appInstanceId": "anonymous-uuid",
  "fcmToken": "firebase-token",
  "platform": "android"
}
```

### Create a watch place

GeoJSON coordinates always use `[longitude, latitude]`.

```http
POST /v1/watch-places
Content-Type: application/json

{
  "appInstanceId": "anonymous-uuid",
  "name": "โรงเรียน",
  "placeType": "school",
  "location": {
    "type": "Point",
    "coordinates": [98.9853, 18.7883]
  },
  "radiusMeters": 500,
  "domains": ["weather"]
}
```

Other watch-place endpoints:

```http
GET    /v1/watch-places?appInstanceId=...
PATCH  /v1/watch-places/:id
DELETE /v1/watch-places/:id?appInstanceId=...
```

### Create an observation

Observations are append-only facts. Duplicate external source records are
deduplicated using `source.name + source.externalId`.

```http
POST /v1/observations
Content-Type: application/json

{
  "type": "weather.heavy_rain_forecast",
  "domain": "weather",
  "source": {
    "name": "manual",
    "externalId": "example-001"
  },
  "location": {
    "type": "Point",
    "coordinates": [98.9853, 18.7883]
  },
  "timestamp": "2026-06-21T08:00:00Z",
  "payload": {
    "precipitationProbability": 85,
    "precipitationMm": 12
  },
  "confidence": 0.85
}
```

### Search observations

```http
GET /v1/observations/nearby?lat=18.7883&lng=98.9853&radiusMeters=5000
GET /v1/observations/window?from=2026-06-21T00:00:00Z&to=2026-06-22T00:00:00Z
```

Optional filters:

```text
types=weather.heavy_rain_forecast,weather.precipitation_forecast
source=openmeteo
limit=100
```

## V1 impact rule

An impact is created when:

```text
observation.type == weather.heavy_rain_forecast
precipitationProbability >= 70
forecast ETA is between now and three hours
```

The matcher then requires:

```text
impact area intersects watch-place radius
watch place has the impact domain enabled
notification cooldown permits sending
```

Every notification attempt is stored in `notification_logs`, including failed
and cooldown-skipped attempts.

## Collections

- `app_devices`
- `watch_places`
- `observations`
- `impacts`
- `notification_logs`

## Test

```powershell
npm test
npm audit --omit=dev
```

The test suite covers health, geospatial distance/intersection, Open-Meteo
normalization/grouping and impact qualification/building.

See [Observation pipeline](docs/observation-pipeline.md) for implementation
details and operational notes.
