const express = require('express');
const devicesRouter = require('./routes/devices');
const notifyRouter = require('./routes/notify');
const observationsRouter = require('./routes/observations');
const watchPlacesRouter = require('./routes/watchPlaces');

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/devices', devicesRouter);
  app.use('/notify', notifyRouter);
  app.use('/v1/observations', observationsRouter);
  app.use('/v1/watch-places', watchPlacesRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
