# WatchMyPlace Adviser

## Core Vision

WatchMyPlace is a place-first risk awareness app.

Users pin places they care about.
The system watches observations from public data, sensors, and community feedback.
It should notify only when a watched place may be impacted.

Core principle:

Collect Facts → Discover Patterns → Predict Impacts

## Current Architecture Direction

Do not build a manual graph first.

Use Observation-first architecture.

Everything becomes an Observation:

- Weather API
- Water level API
- PM2.5 API
- Government data
- Community feedback
- Volunteer reports
- Sensors

Observation fields:

- type
- source
- location
- timestamp
- payload

## Main Pipeline

Public Data / Sensors / Community
→ Observation Store
→ Pattern Mining
→ Discovered Relations
→ Impact Prediction
→ Watch Places
→ Notification

## Important Rules

- Do not overbuild.
- Do not add AI yet.
- Do not add graph database yet.
- Do not hardcode too many domain rules.
- Keep workers modular.
- Every feature must support place-first thinking.
- Feedback is just another Observation.
- Public data is just another Observation source.
- Notifications must be rare and meaningful.

## MVP Priority

1. Save watch places
2. Save observations
3. Search nearby observations by location and time
4. Create simple impact prediction
5. Match watch places
6. Send notification
7. Log notification result

## Design Principle

The app should stay quiet unless something truly matters.

## Product Phrase

Pin it. We'll watch it.
ปักหมุดไว้ ที่เหลือเราจะเฝ้าให้
