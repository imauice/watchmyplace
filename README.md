# WatchMyPlace

> Pin it. We'll watch it.  
> ปักหมุดไว้ ที่เหลือเราจะเฝ้าให้

## Overview

WatchMyPlace is a place-first risk awareness platform.

Users pin places they care about:

- 🏠 Home
- 🏫 School
- 🏢 Office
- 🏥 Hospital
- 🏪 Shop

The platform continuously collects observations from public data, sensors and
community feedback, discovers patterns, predicts possible impacts and sends
meaningful notifications.

---

## Core Philosophy

Collect Facts

↓

Discover Patterns

↓

Predict Impacts

---

## Design Principles

- Place First
- Observation First
- Community Powered
- Explainable Decisions
- Data before AI
- Simple before Smart

---

## Architecture

External Sources

- Open-Meteo
- Water APIs
- Government Data
- Sensors
- Community Feedback
- Historical Imports

↓

Observation Store

↓

Pattern Mining

↓

Impact Prediction

↓

Watch Places

↓

Notification

---

## Repository Guide

| File | Purpose |
|------|---------|
| [VISION.md](VISION.md) | Product vision and philosophy |
| [ROADMAP.md](ROADMAP.md) | Long-term implementation roadmap |
| [TASK.md](TASK.md) | Current sprint tasks |
| [AGENTS.md](AGENTS.md) | Instructions for AI agents and Codex |

Project folders:

- [`backend/`](backend/README.md) — Express, MongoDB, Open-Meteo workers and FCM
- `watchmyplace/` — Flutter Android application

---

## MVP

- Pin places
- Collect Open-Meteo observations
- Store observations
- Generate simple impacts
- Match watch places
- Send notifications
- Collect community feedback

---

## Long-term Goal

Build a community-powered, observation-driven risk intelligence platform that
becomes more accurate over time by learning from:

- Public data
- Sensors
- Community observations
- Historical outcomes

---

## Project Motto

We do not try to model the world.

We collect observations.

We discover patterns.

We predict impacts.

So people can spend less time worrying and more time living.
