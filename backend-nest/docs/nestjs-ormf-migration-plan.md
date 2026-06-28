# NestJS + ORMF v1 Migration Plan

## Goal

Migrate the current Express backend to NestJS + TypeScript while keeping the WatchMyPlace architecture simple and observation-first.

Target behavior follows the ORMF v1 simulation:

Observer / Source  
→ Observation Store  
→ Fast Subscription Delivery  
→ Route Mining Analysis  
→ Impact Prediction  
→ Watch Place Notification

The same Observation record must support both fast delivery and route mining. Do not create a manual graph database. Do not add AI.

---

## Non-goals

- No graph database.
- No machine learning.
- No AI agents as decision makers.
- No complex causal discovery.
- No user accounts.
- No personal data.
- No rewrite of the Flutter UI during backend migration unless API shape changes require it.

---

## Migration Strategy

Use a staged migration instead of a big-bang rewrite.

1. Create a new NestJS backend skeleton.
2. Port existing models and APIs with the same endpoint contracts.
3. Add ORMF v1 modules behind simple APIs and workers.
4. Switch Flutter to the NestJS API only after parity checks pass.
5. Remove the old Express backend after the NestJS backend can run the current app flow.

Recommended temporary folder:

```text
backend-nest/
```

After migration is stable, rename:

```text
backend/        old Express backup
backend-nest/   new NestJS backend
```

Then finalize:

```text
backend/        NestJS backend
```

---

## Proposed NestJS Module Structure

```text
backend/
  src/
    main.ts
    app.module.ts

    config/
      configuration.ts
      validation.schema.ts

    database/
      database.module.ts

    devices/
      devices.module.ts
      devices.controller.ts
      devices.service.ts
      schemas/app-device.schema.ts
      dto/register-device.dto.ts

    watch-places/
      watch-places.module.ts
      watch-places.controller.ts
      watch-places.service.ts
      schemas/watch-place.schema.ts
      dto/create-watch-place.dto.ts
      dto/list-watch-places.dto.ts

    observations/
      observations.module.ts
      observations.controller.ts
      observations.service.ts
      schemas/observation.schema.ts
      dto/create-observation.dto.ts
      dto/search-observations.dto.ts

    observers/
      observers.module.ts
      observers.service.ts
      schemas/observer.schema.ts

    subscriptions/
      subscriptions.module.ts
      subscriptions.service.ts
      schemas/subscription.schema.ts

    route-mining/
      route-mining.module.ts
      route-mining.service.ts
      schemas/route-relation.schema.ts

    impacts/
      impacts.module.ts
      impacts.service.ts
      schemas/impact.schema.ts

    notifications/
      notifications.module.ts
      notifications.service.ts
      schemas/notification-log.schema.ts

    integrations/
      open-meteo/
        open-meteo.module.ts
        open-meteo.service.ts

    workers/
      workers.module.ts
      open-meteo.worker.ts
      route-mining.worker.ts
      impact.worker.ts
      notification.worker.ts

    common/
      geo/
        geo.service.ts
      types/
        geojson.ts
```

---

## Core Collections

### app_devices

Existing push MVP collection.

```ts
appInstanceId: string
fcmToken: string
platform: 'android' | 'ios'
createdAt: Date
lastSeenAt: Date
```

### watch_places

Places pinned by anonymous app instances.

```ts
appInstanceId: string
name: string
placeType: string
location: GeoJSON Point
radiusMeters: number
domains: string[]
address?: string
note?: string
isActive: boolean
createdAt: Date
updatedAt: Date
```

Indexes:

```text
location: 2dsphere
appInstanceId + createdAt
```

### observers

ORMF v1 source nodes. These are not users. They are observation sources.

Examples:

- Open-Meteo
- River sensor
- Community report source
- Government API
- Road camera

```ts
name: string
kind: 'official' | 'physical' | 'community' | 'indirect' | 'system'
source: string
location?: GeoJSON Point
reliability: number
notifyRadiusMeters: number
discoveryRadiusMeters: number
isActive: boolean
createdAt: Date
updatedAt: Date
```

Indexes:

```text
location: 2dsphere
kind
source
```

### observations

Immutable facts. Everything becomes an Observation.

```ts
type: string
source: string
observerId?: ObjectId
location: GeoJSON Point
timestamp: Date
severity?: number
confidence?: number
payload: Record<string, unknown>
createdAt: Date
```

Indexes:

```text
location: 2dsphere
timestamp
type + source + timestamp
observerId + timestamp
```

Rule:

Do not mutate an observation to change history. If later evidence disputes it, store another observation such as `observation.disputed` or `status.resolved`.

### subscriptions

Fast delivery graph from observer/source to watch place.

This is not a global knowledge graph. It is a simple routing table for relevant delivery.

```ts
observerId: ObjectId
watchPlaceId: ObjectId
distanceMeters: number
domain: string
isCandidate: boolean
isActive: boolean
createdBy: 'watch_place_added' | 'observer_added' | 'system'
createdAt: Date
updatedAt: Date
```

Indexes:

```text
observerId + watchPlaceId unique
watchPlaceId
observerId
isActive
```

### route_relations

Mining result from accumulated observations.

This is the equivalent of the simulation route evidence.

```ts
fromType: string
toType: string
domain: string
observedCount: number
sourceDiversity: number
avgDelayMinutes: number
avgDistanceMeters: number
lastSeenAt: Date
observerReliability: number
confidence: number
isCandidate: boolean
isDisputed: boolean
createdAt: Date
updatedAt: Date
```

Indexes:

```text
fromType + toType + domain unique
confidence
lastSeenAt
```

### impacts

Predicted local impacts.

```ts
type: string
domain: string
location: GeoJSON Point
severity: 'low' | 'medium' | 'high'
riskScore: number
confidence: number
eta?: Date
reason: string
evidence: {
  observationIds: ObjectId[]
  relationIds: ObjectId[]
  sources: string[]
}
createdAt: Date
expiresAt: Date
```

Indexes:

```text
location: 2dsphere
expiresAt
domain + createdAt
```

### notification_logs

Delivery audit and cooldown.

```ts
appInstanceId: string
watchPlaceId: ObjectId
impactId?: ObjectId
observationId?: ObjectId
kind: 'observation_delivery' | 'impact_alert' | 'test'
status: 'sent' | 'skipped' | 'failed'
reason?: string
dedupeKey: string
createdAt: Date
```

Indexes:

```text
dedupeKey unique
appInstanceId + createdAt
watchPlaceId + kind + createdAt
```

---

## ORMF v1 Services

### ObservationService

Responsibilities:

- Create observations.
- Search nearby observations.
- Search by time window.
- Filter by type/source.
- Keep observations append-only.

Important method:

```ts
findNearbyObservations(input: {
  longitude: number
  latitude: number
  radiusMeters: number
  fromTime?: Date
  toTime?: Date
  types?: string[]
  sources?: string[]
})
```

### SubscriptionService

Responsibilities:

- When a watch place is created, subscribe it to nearby observers.
- When an observer is created, connect it to nearby watch places.
- Keep routes local and simple.
- Do not skip intermediate nodes for delivery if later we support multi-hop.

V1 rule:

```text
watch place added
→ find observers within discoveryRadiusMeters
→ create candidate subscriptions
```

### RouteMiningService

Responsibilities:

- Mine repeated local sequences from observations.
- Update route_relations using frequency counting.
- Estimate confidence from evidence.

V1 confidence formula based on the simulation:

```text
frequency = 1 - exp(-observedCount / 38)
diversity = min(1, 0.55 + sourceDiversity * 0.15)
recency = exp(-0.018 * lastSeenAgeMinutes)
candidatePenalty = isCandidate ? 0.72 : 1
disputedPenalty = isDisputed ? 0.55 : 1

confidence =
  frequency
  * diversity
  * recency
  * observerReliability
  * candidatePenalty
  * disputedPenalty
```

This is not truth. It is only an estimate from accumulated observations.

### ImpactService

Responsibilities:

- Convert strong observations and relations into local impacts.
- Keep V1 rule simple.

Initial V1 rule:

```text
heavy_rain_forecast
+ probability >= 70%
+ ETA <= 3 hours
→ create flood_risk impact
```

ORMF route rule:

```text
observation + strong route relation
→ create impact near route target
```

Start with one or two risk domains only:

- flood
- air_quality later

### NotificationService

Responsibilities:

- Fast observation delivery to subscribed watch places.
- Impact alerts to matched watch places.
- FCM send.
- Deduplicate.
- Cooldown.
- Log every attempt.

V1 thresholds:

```text
observation delivery threshold: confidence >= 0.55
impact notification threshold: riskScore >= 0.70 and confidence >= 0.55
cooldown: 60 minutes per watchPlace + domain + impact type
```

---

## API Contract

Keep current Flutter-compatible endpoints:

```text
GET  /health
POST /devices/register
POST /notify/test
GET  /watch-places
POST /watch-places
DELETE /watch-places/:id
```

Add ORMF endpoints:

```text
POST /observations
GET  /observations/nearby
GET  /observers
POST /observers
GET  /subscriptions
POST /workers/open-meteo/run-once
POST /workers/route-mining/run-once
POST /workers/impact/run-once
POST /workers/notification/run-once
```

Worker endpoints should be protected later. During local MVP they can remain local/dev-only.

---

## Implementation Phases

### Phase 0: Safety and parity checklist

- Freeze current Express endpoint behavior.
- Record sample requests/responses from Flutter.
- Keep `.env` shape compatible.
- Do not break FCM registration.

Deliverable:

```text
NestJS migration checklist ready.
```

### Phase 1: NestJS foundation

- Scaffold NestJS + TypeScript.
- Add config validation.
- Add MongoDB via `@nestjs/mongoose`.
- Add Firebase Admin provider.
- Add health endpoint.

Deliverable:

```text
GET /health works.
```

### Phase 2: Port current MVP APIs

- Port devices.
- Port watch places.
- Port notify/test.
- Port existing observation, impact and notification models.
- Keep endpoint contracts compatible with Flutter.

Deliverable:

```text
Current Flutter app works against NestJS.
```

### Phase 3: ORMF observer + subscription layer

- Add observers collection.
- Seed default observers:
  - Open-Meteo
  - Community
  - System
- On watch place creation, create candidate subscriptions to nearby observers.
- Add subscription listing for debugging.

Deliverable:

```text
Pin place → subscriptions created.
```

### Phase 4: Observation ingestion

- Add typed create observation API.
- Port Open-Meteo worker.
- Store Open-Meteo forecast as observations.
- Store community feedback as observations.

Deliverable:

```text
Public data and feedback both become observations.
```

### Phase 5: Fast subscription delivery

- When new observation arrives:
  - find active subscriptions for observer/source
  - calculate delivery confidence
  - log eligible delivery
  - notify only if threshold and cooldown pass

Deliverable:

```text
Observation → subscribed watch places → notification log / FCM.
```

### Phase 6: Route mining

- Search nearby observations in a time window.
- Count repeated sequences by type/domain.
- Update route_relations.
- Recalculate confidence.

Deliverable:

```text
Observation history updates route confidence.
```

### Phase 7: Impact prediction

- Keep existing heavy rain rule.
- Add ORMF relation-based impact builder.
- Match impacts to watch places.
- Notify with evidence and confidence.

Deliverable:

```text
Observation + relation → impact → matched places → notification.
```

### Phase 8: Cleanup and cutover

- Run old and new backend parity tests.
- Switch Flutter base URL if needed.
- Rename NestJS backend into `backend/`.
- Archive Express backend or remove after confirmation.

Deliverable:

```text
NestJS backend is the main backend.
```

---

## Test Plan

### Unit tests

- Geo distance and nearby search.
- Confidence formula.
- Subscription creation.
- Deduplication key.
- Cooldown.

### Integration tests

- Register device.
- Create watch place.
- Auto-create subscriptions.
- Create observation.
- Search nearby observations.
- Create impact.
- Match watch place.
- Log notification.

### Manual local test

```text
1. Start NestJS backend
2. Run adb reverse tcp:3000 tcp:3000
3. Open Flutter app on physical Android device
4. Pin a place
5. Run Open-Meteo worker once
6. Run impact worker once
7. Run notification worker once
8. Confirm notification log and push notification
```

---

## First Implementation Slice

Build the smallest useful NestJS slice first:

```text
GET  /health
POST /devices/register
GET  /watch-places
POST /watch-places
DELETE /watch-places/:id
POST /observations
GET  /observations/nearby
```

Then add:

```text
watch place created
→ nearby observer lookup
→ candidate subscriptions created
```

This gives us the foundation from the simulation without overbuilding.

---

## Implementation Status

### Done in `backend-nest/`

- NestJS + TypeScript skeleton.
- Fastify runtime to avoid unused upload middleware dependencies.
- MongoDB connection through `@nestjs/mongoose`.
- Optional Firebase Admin provider.
- API parity foundation:
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
- ORMF v1 foundation:
  - `observers`
  - `subscriptions`
  - `route_relations`
  - confidence formula from the simulation
- Worker parity foundation:
  - Open-Meteo worker
  - heavy-rain impact worker
  - impact notification worker
  - `pipeline:once`

### Next

- Start MongoDB locally and smoke test endpoints.
- Add route-mining worker from stored observation windows.
- Add relation-based impact builder after enough observation data exists.
- Switch Flutter to `backend-nest` only after parity testing.
