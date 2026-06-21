require('dotenv').config();

const mongoose = require('mongoose');
const { initializeFirebase } = require('../config/firebase');
const { runOpenMeteoWorker } = require('./openMeteo.worker');
const { runImpactWorker } = require('./impact.worker');
const { runNotificationWorker } = require('./notification.worker');

const workerName = process.argv[2];
const workers = {
  'open-meteo': {
    run: runOpenMeteoWorker,
    intervalMinutes: Number(process.env.OPEN_METEO_INTERVAL_MINUTES || 60),
    needsFirebase: false,
  },
  impact: {
    run: runImpactWorker,
    intervalMinutes: Number(process.env.IMPACT_INTERVAL_MINUTES || 5),
    needsFirebase: false,
  },
  notification: {
    run: runNotificationWorker,
    intervalMinutes: Number(process.env.NOTIFICATION_INTERVAL_MINUTES || 1),
    needsFirebase: true,
  },
};

async function start() {
  const worker = workers[workerName];
  if (!worker) throw new Error(`Unknown worker: ${workerName}`);

  await mongoose.connect(process.env.MONGODB_URI);
  if (worker.needsFirebase) initializeFirebase();

  let running = false;
  const execute = async () => {
    if (running) return;
    running = true;
    try {
      const result = await worker.run();
      console.log(
        JSON.stringify({
          worker: workerName,
          completedAt: new Date().toISOString(),
          result,
        }),
      );
    } catch (error) {
      console.error(`[${workerName}]`, error);
    } finally {
      running = false;
    }
  };

  await execute();
  setInterval(execute, worker.intervalMinutes * 60 * 1000);
  console.log(
    `${workerName} worker running every ${worker.intervalMinutes} minute(s)`,
  );
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
