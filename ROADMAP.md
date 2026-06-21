# WatchMyPlace ROADMAP

## Core Philosophy

WatchMyPlace is a place-first risk awareness platform.

Users pin places they care about. The system collects real-world observations from public data, sensors, and community feedback. It discovers patterns over time and predicts possible impacts on watched places.

Core principle:

> Collect Facts → Discover Patterns → Predict Impacts

Do not start with AI. Do not start with a manual graph. Start by collecting clean observations.

---

## Product Vision

WatchMyPlace should help people live normally without constantly monitoring every risk themselves.

The app should stay quiet most of the time.

Notify only when a watched place may be affected and the user still has time to act.

Tagline:

> Pin it. We'll watch it.  
> ปักหมุดไว้ ที่เหลือเราจะเฝ้าให้

---

## Architecture Direction

Everything becomes an Observation.

Examples:

- Weather API data
- Open-Meteo forecast
- Water level data
- PM2.5 data
- Government announcements
- Sensor readings
- Community feedback
- Volunteer reports
- News or historical records

All sources should be normalized into one common Observation model.

---

## Main Pipeline

```txt
External Sources
  - Open-Meteo
  - Water APIs
  - PM2.5 APIs
  - Government data
  - Community reports
  - Sensors
  - Historical imports

        ↓

Observation Store

        ↓

Nearby Search / Time Window Search

        ↓

Simple Impact Detection

        ↓

Watch Place Matching

        ↓

Notification

        ↓

Feedback as Observation

        ↓

Pattern Mining later
```

---

## Phase 0: Foundation Already Started

Goal: make the app real.

Status target:

- Flutter app runs
- Device registration works
- FCM notification works
- User can pin places
- Backend can save and return places

Core collections:

- `app_devices`
- `watch_places`
- `notifications`

Do not overbuild.

---

## Phase 1: Observation Store

Goal: create the foundation for all future intelligence.

Create collection:

```js
observations {
  _id,
  type,
  domain,
  source,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  observedAt,
  payload,
  confidence,
  createdAt
}
```

Indexes:

```js
location: "2dsphere"
observedAt: -1
type: 1
source: 1
```

Rules:

- Every external input becomes an observation.
- Feedback is also an observation.
- Public data is also an observation.
- Sensors are also observations.
- Do not create separate complex event models yet.

---

## Phase 2: Open-Meteo Observation Worker

Goal: collect real weather data first.

Worker name:

```txt
openmeteo-observation-worker
```

Responsibilities:

1. Read watch places with weather-related domains.
2. Group nearby places to reduce API calls.
3. Call Open-Meteo forecast API.
4. Normalize forecast into observations.
5. Save observations.
6. Do not send notifications directly from this worker.

Example observation types:

```txt
weather.precipitation_forecast
weather.rain_probability
weather.heavy_rain_forecast
```

Example payload:

```js
{
  precipitationMm: 24,
  precipitationProbability: 85,
  forecastHour: 3,
  raw: {}
}
```

---

## Phase 3: Nearby Observation Search

Goal: allow the system to find what happened near a place or event.

Create helper/service:

```txt
ObservationSearchService
```

Functions:

```js
findNearbyObservations({
  location,
  radiusMeters,
  fromTime,
  toTime,
  types
})
```

Use MongoDB geospatial query.

This is the first building block for future pattern mining.

---

## Phase 4: Simple Impact Worker

Goal: create useful alerts without AI or mining.

Worker name:

```txt
impact-worker
```

V1 rule example:

```txt
If heavy rain forecast near a watch place
and probability >= 70%
and forecast is within 1-3 hours
then create an impact candidate.
```

Create collection:

```js
impacts {
  _id,
  type,
  domain,
  severity,
  location,
  radiusMeters,
  etaMinutes,
  confidence,
  reason,
  relatedObservationIds,
  status,
  validFrom,
  validUntil,
  createdAt
}
```

Example impact:

```js
{
  type: "heavy_rain_possible",
  domain: "weather",
  severity: "watch",
  etaMinutes: 120,
  confidence: 0.78,
  reason: "High rain probability in the next 2 hours"
}
```

---

## Phase 5: Match Watch Places

Goal: notify only places affected by an impact.

Service:

```txt
PlaceImpactMatcher
```

Input:

```txt
impact
```

Output:

```txt
matched watch_places
```

Logic:

```txt
impact area intersects place radius
AND place has matching domain enabled
AND notification cooldown allows sending
```

Do not notify everyone.

Only notify affected places.

---

## Phase 6: Notification Engine

Goal: send meaningful notifications with cooldown and deduplication.

Collection:

```js
notification_logs {
  _id,
  appInstanceId,
  placeId,
  impactId,
  type,
  severity,
  title,
  body,
  sentAt,
  status
}
```

Rules:

- Do not send duplicate alerts for the same place and impact.
- Use cooldown.
- Notify only on meaningful state changes.
- Keep messages calm and actionable.

Example message:

```txt
🟠 โรงเรียนสาธิต

มีโอกาสฝนตกหนักในพื้นที่ภายใน 2 ชั่วโมง
อาจกระทบการเดินทาง

เราจะแจ้งอีกครั้งหากความเสี่ยงสูงขึ้น
```

---

## Phase 7: Community Feedback

Goal: let users report what they see at their watched place.

Important principle:

Feedback is not special. Feedback becomes an Observation.

User should report from a watched place screen.

Simple buttons:

```txt
✅ ปกติ
🌧 ฝนตกหนัก
🌊 น้ำเริ่มขัง
🚧 ถนนผ่านไม่ได้
⚠️ รุนแรงกว่าที่แจ้ง
✔️ คลี่คลายแล้ว
➕ เพิ่มรายละเอียด
```

Create endpoint:

```txt
POST /observations/community
```

Body:

```js
{
  appInstanceId,
  placeId,
  type,
  message,
  location,
  payload
}
```

Store as:

```js
source: "community"
```

---

## Phase 8: Historical Import

Goal: bootstrap the system with past incidents.

Sources may include:

- Old news
- Government reports
- Flood maps
- Public incident logs
- Local authority announcements

Important:

Do not store full articles as core data. Extract only observations.

Example:

```js
{
  type: "flood.reported",
  source: "historical_news",
  location,
  observedAt,
  payload: {
    placeName: "ตลาดวโรรส",
    description: "Reported flooding near market",
    referenceUrl: "..."
  },
  confidence: 0.6
}
```

Historical data helps the system avoid starting from zero.

---

## Phase 9: Pattern Mining

Goal: discover repeated relations from observations.

Do this only after enough observations exist.

V1 mining logic:

```txt
For each target observation type, such as water_pooled:
  Search previous observations nearby
  Look back within a time window
  Count common preceding observation types
  Track average delay and distance
  Update relation support/confidence
```

Create collection:

```js
relations {
  _id,
  fromType,
  toType,
  domain,
  regionKey,
  support,
  confidence,
  avgDelayMinutes,
  avgDistanceMeters,
  lastSeenAt,
  createdAt,
  updatedAt
}
```

Important:

- Relations are discovered knowledge.
- Relations are not assumed to be true immediately.
- Relation confidence grows with repeated evidence.
- Correlation is not always causation.

---

## Phase 10: Living Risk Graph

Goal: derive graph-like knowledge from mined relations.

Do not build graph database early.

Start with `relations`.

Later, relations can become a Living Risk Graph.

Concept:

```txt
Observations
  ↓
Pattern Mining
  ↓
Discovered Relations
  ↓
Living Risk Graph
  ↓
Impact Prediction
```

Graph is output, not input.

---

## Phase 11: Flood Domain

Goal: build the first high-value domain after weather is stable.

Flood should use:

- Rain observations
- Water level observations
- Water rise rate
- Community flood reports
- Historical flood observations
- Local pattern mining

Flood is not simple radius matching.

Flood should eventually understand:

```txt
upstream → downstream
river station → affected areas
rainfall → water rise → local flooding
```

But V1 can start simple:

```txt
heavy rain + community water_pooled reports + nearby watch places
```

---

## What Not To Do Yet

Do not implement these too early:

- AI decision engine
- LLM-based prediction
- Graph database
- Graph neural network
- Full causal discovery
- National-scale flood model
- Complex volunteer reputation
- Route network modeling
- River topology modeling

Build the data pipeline first.

---

## Coding Principles for Codex

1. Keep every task small.
2. Do not rewrite the whole project.
3. Do not change Flutter/Gradle/Firebase unless explicitly asked.
4. Keep backend modules separated.
5. Prefer services and workers.
6. Add indexes when creating geospatial collections.
7. Always log notification attempts.
8. Store observations before trying to analyze them.
9. Make APIs testable with manual endpoints.
10. Keep README updated.

---

## MVP Milestone

The first meaningful end-to-end milestone:

```txt
User pins a place
  ↓
Open-Meteo worker saves observations near that place
  ↓
Impact worker detects heavy rain forecast
  ↓
Matcher finds the pinned place
  ↓
Notification worker sends push
  ↓
User can report actual situation
  ↓
Feedback is saved as observation
```

If this works, WatchMyPlace has its first real learning loop.

---

## Long-term Vision

WatchMyPlace should become a community-powered, observation-driven risk intelligence system.

It should learn from:

- Public data
- Sensors
- Community reports
- Historical outcomes

The system should become more accurate over time.

Final guiding phrase:

> Collect Facts → Discover Patterns → Predict Impacts
