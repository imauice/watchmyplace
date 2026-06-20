require('dotenv').config();

const mongoose = require('mongoose');
const { createApp } = require('./app');
const { initializeFirebase } = require('./config/firebase');

const port = Number(process.env.PORT || 3000);

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  initializeFirebase();

  const app = createApp();
  app.listen(port, () => {
    console.log(`WatchMyPlace backend listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exitCode = 1;
});

