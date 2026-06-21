const express = require('express');
const WatchPlace = require('../models/WatchPlace');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { appInstanceId, name, location } = req.body;
    if (!appInstanceId || !name || !location) {
      return res.status(400).json({
        error: 'appInstanceId, name and location are required',
      });
    }
    const place = await WatchPlace.create(req.body);
    return res.status(201).json({ place });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    if (!req.query.appInstanceId) {
      return res.status(400).json({ error: 'appInstanceId is required' });
    }
    const places = await WatchPlace.find({
      appInstanceId: req.query.appInstanceId,
    }).sort({ createdAt: -1 });
    return res.json({ places });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!req.body.appInstanceId) {
      return res.status(400).json({ error: 'appInstanceId is required' });
    }
    const updates = { ...req.body };
    delete updates.appInstanceId;
    const place = await WatchPlace.findOneAndUpdate(
      { _id: req.params.id, appInstanceId: req.body.appInstanceId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    );
    if (!place) return res.status(404).json({ error: 'Place not found' });
    return res.json({ place });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.query.appInstanceId) {
      return res.status(400).json({ error: 'appInstanceId is required' });
    }
    const place = await WatchPlace.findOneAndDelete({
      _id: req.params.id,
      appInstanceId: req.query.appInstanceId,
    });
    if (!place) return res.status(404).json({ error: 'Place not found' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
