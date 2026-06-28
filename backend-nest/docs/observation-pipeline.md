# Observation Pipeline v1

## Scope

This is the first deterministic end-to-end pipeline:

```text
Pinned place
→ Weather observation
→ Heavy-rain impact
→ Place match
→ Push notification
→ Delivery log
```

Pattern mining and discovered relations are intentionally deferred.

## Modules

### Observation Store

`observations` is the common store for public data, sensors and future community
feedback.

Important indexes:

- `location: 2dsphere`
- `timestamp`
- `type + timestamp`
- unique `source.name + source.externalId`

### Watch Places

`watch_places` stores anonymous places owned by `appInstanceId`.

Updates and deletes require the matching `appInstanceId`. Location coordinates
follow GeoJSON order: longitude first, latitude second.

### Open-Meteo Worker

The worker:

1. Reads active places with the `weather` domain.
2. Groups close coordinates by rounded latitude/longitude.
3. Requests six forecast hours.
4. Normalizes hourly data into observations.
5. Uses a stable external ID to avoid duplicates.

The worker never sends notifications.

### Impact Worker

The v1 impact worker uses one transparent rule:

```text
heavy-rain forecast
+ probability >= 70%
+ ETA <= 3 hours
```

An impact is unique per source observation and impact type.

### Notification Worker

The worker:

1. Reads active, unexpired impacts.
2. Finds nearby watch places using MongoDB geospatial search.
3. Verifies circle intersection with Haversine distance.
4. Checks enabled domains.
5. Checks duplicate delivery and cooldown.
6. Sends FCM.
7. Logs `sent`, `failed` or `skipped`.

The unique key `impactId + placeId` prevents duplicate delivery for the same
impact.

## Worker replacement

Each worker exports a `run...Worker()` function and can run:

- continuously through `src/workers/loop.js`
- once through `src/workers/run.js`
- inside tests or future schedulers

This keeps collection, prediction and notification independently replaceable.

## Current limitations

- No durable message queue
- No distributed worker lock
- No pattern mining
- No relation store
- No community feedback endpoint
- No historical importer
- Weather grouping uses coordinate rounding, not advanced clustering

These are deliberate limits for the first sprint.

## Verification completed

- Unit tests pass
- npm audit reports no vulnerabilities
- MongoDB create/search integration passed
- Live Open-Meteo request returned six forecast hours
- Impact worker created an impact from a test observation
- Notification worker matched a place and logged a missing-device failure
- Existing Firebase test push uses the same messaging service
