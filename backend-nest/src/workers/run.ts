import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImpactsService } from '../impacts/impacts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OpenMeteoService } from '../open-meteo/open-meteo.service';

type WorkerName = 'open-meteo' | 'impact' | 'notification' | 'pipeline';

async function run() {
  const workerName = (process.argv[2] || 'pipeline') as WorkerName;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const result: Record<string, unknown> = {};

    if (workerName === 'open-meteo' || workerName === 'pipeline') {
      result.openMeteo = await app.get(OpenMeteoService).runOnce();
    }

    if (workerName === 'impact' || workerName === 'pipeline') {
      result.impact = await app.get(ImpactsService).runHeavyRainImpactWorker();
    }

    if (workerName === 'notification' || workerName === 'pipeline') {
      result.notification = await app
        .get(NotificationsService)
        .runImpactNotificationWorker();
    }

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
