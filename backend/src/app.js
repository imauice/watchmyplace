const express = require('express');
const devicesRouter = require('./routes/devices');
const notifyRouter = require('./routes/notify');

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/devices', devicesRouter);
  app.use('/notify', notifyRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };

