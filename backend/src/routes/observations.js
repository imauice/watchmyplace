const express = require('express');
const {
  createObservation,
  findNearbyObservations,
  findTimeWindowObservations,
} = require('../services/observation.service');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { type, domain, source, location, timestamp, observedAt } = req.body;
    if (!type || !domain || !source || !location || !(timestamp || observedAt)) {
      return res.status(400).json({
        error: 'type, domain, source, location and timestamp are required',
      });
    }
    const observation = await createObservation(req.body);
    return res.status(201).json({ observation });
  } catch (error) {
    return next(error);
  }
});

router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radiusMeters = 5000 } = req.query;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const observations = await findNearbyObservations({
      location: [Number(lng), Number(lat)],
      radiusMeters: Number(radiusMeters),
      fromTime: req.query.from,
      toTime: req.query.to,
      types: req.query.types?.split(',').filter(Boolean),
      source: req.query.source,
      limit: Number(req.query.limit || 100),
    });
    return res.json({ observations });
  } catch (error) {
    return next(error);
  }
});

router.get('/window', async (req, res, next) => {
  try {
    if (!req.query.from || !req.query.to) {
      return res.status(400).json({ error: 'from and to are required' });
    }
    const observations = await findTimeWindowObservations({
      fromTime: req.query.from,
      toTime: req.query.to,
      types: req.query.types?.split(',').filter(Boolean),
      source: req.query.source,
      limit: Number(req.query.limit || 100),
    });
    return res.json({ observations });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
