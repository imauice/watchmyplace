# WatchMyPlace Backend NestJS

NestJS + TypeScript migration target for WatchMyPlace.

This backend keeps the existing Flutter-compatible APIs while adding the ORMF v1 foundation:

```text
Observer / Source
→ Observation Store
→ Fast Subscription Delivery
→ Route Mining Analysis
→ Impact Prediction
→ Watch Place Notification
```

## Setup

```powershell
npm install
Copy-Item .env.example .env
npm run build
npm run start
```

MongoDB must be running before the app can listen:

```text
mongodb://127.0.0.1:27017/watchmyplace
```

## API parity

Implemented:

- `GET /health`
- `POST /devices/register`
- `POST /notify/test`
- `GET /watch-places`
- `POST /watch-places`
- `PATCH /watch-places/:id`
- `DELETE /watch-places/:id`
- `POST /observations`
- `GET /observations/nearby`
- `GET /observations/window`
- `GET /observers`
- `POST /observers`
- `GET /subscriptions`
- `GET /route-relations`
- `POST /route-relations/evidence`
- `GET /impacts/active`
- `POST /impacts/run-once`
- `POST /workers/open-meteo/run-once`
- `POST /notify/run-once`

## Workers

Build before running workers:

```powershell
npm run build
```

Run one worker once:

```powershell
npm run worker:open-meteo:once
npm run worker:impact:once
npm run worker:notification:once
```

Run the current pipeline once:

```powershell
npm run pipeline:once
```

Pipeline order:

```text
Open-Meteo → Observations → Impacts → Notifications
```

Compatibility aliases:

- `/v1/watch-places`
- `/v1/observations`

## Current migration status

This folder is intentionally separate from `backend/` until API parity is verified with the Flutter app.

Verified locally:

- `npm run typecheck`
- `npm run build`
- `npm audit --omit=dev`
