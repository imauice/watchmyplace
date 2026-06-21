# Current Sprint

## Goal

Build the first end-to-end Observation pipeline.

Success criteria:

User pins a place  
→ Open-Meteo observation collected  
→ Observation stored  
→ Impact generated  
→ Notification sent

---

# Priority P0

## TASK-001 Observation Model

- [x] Create `observations` collection
- [x] Add 2dsphere index
- [x] Add timestamp index
- [x] Create Observation interface/model

Deliverable:  
Observation CRUD ready.

---

## TASK-002 Watch Places

- [x] Create `watch_places` collection
- [x] Create API
- [x] Add radius/domain support

Deliverable:  
User can pin places.

---

## TASK-003 Open-Meteo Worker

- [x] Read active watch places
- [x] Group nearby locations
- [x] Fetch forecast
- [x] Normalize to Observation
- [x] Save Observation

Deliverable:  
Weather observations stored automatically.

---

## TASK-004 Observation Search

- [x] Nearby search
- [x] Time window search
- [x] Filter by type/source

API:

```text
findNearbyObservations(location, radiusMeters, fromTime, toTime, types)
```

---

## TASK-005 Impact Worker

V1 rule:

```text
heavy_rain_forecast
+
probability >= 70%
+
ETA <= 3 hours

↓

Create Impact
```

Deliverable:  
Impact records created. ✅

---

## TASK-006 Place Matcher

- [x] Match impacts with `watch_places`
- [x] Respect enabled domains
- [x] Respect cooldown

Deliverable:  
Affected places identified.

---

## TASK-007 Notification Worker

- [x] Push notification
- [x] Log notification
- [x] Deduplicate
- [x] Cooldown

Deliverable:  
End-to-end notification works.

---

# Priority P1

## Community Feedback

Feedback is Observation.

Buttons:

- Normal
- Heavy Rain
- Water Pooled
- Road Closed
- Resolved

Store:

```text
source = community
```

---

## Historical Import

Extract observations only.

Do not store articles as core data.

---

# Priority P2

## Pattern Mining

- Frequency counting
- Nearby observation search
- Time-window relation discovery
- Relation confidence

No AI.  
No Graph DB.

---

# Principles

1. Keep tasks small.
2. Observation first.
3. Public data == Observation.
4. Feedback == Observation.
5. Build data pipeline before intelligence.
6. Collect Facts → Discover Patterns → Predict Impacts.
