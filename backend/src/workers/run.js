require('dotenv').config();

const mongoose = require('mongoose');
const { initializeFirebase } = require('../config/firebase');
const { runOpenMeteoWorker } = require('./openMeteo.worker');
const { runImpactWorker } = require('./impact.worker');
const { runNotificationWorker } = require('./notification.worker');

const workerName = process.argv[2] || 'pipeline';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  if (workerName === 'notification' || workerName === 'pipeline') {
    initializeFirebase();
  }

  const result = {};
  if (workerName === 'open-meteo' || workerName === 'pipeline') {
    result.openMeteo = await runOpenMeteoWorker();
  }
  if (workerName === 'impact' || workerName === 'pipeline') {
    result.impact = await runImpactWorker();
  }
  if (workerName === 'notification' || workerName === 'pipeline') {
    result.notification = await runNotificationWorker();
  }

  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
