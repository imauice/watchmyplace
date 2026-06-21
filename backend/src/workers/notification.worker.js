const AppDevice = require('../models/AppDevice');
const Impact = require('../models/Impact');
const NotificationLog = require('../models/NotificationLog');
const WatchPlace = require('../models/WatchPlace');
const riskConfig = require('../config/risk');
const { areasIntersect } = require('../services/geo.service');
const { sendToToken } = require('../services/firebaseMessaging.service');

function messageForImpact(impact, place) {
  const etaMinutes = Math.max(
    0,
    Math.round((new Date(impact.eta).getTime() - Date.now()) / 60000),
  );
  return {
    title: `WatchMyPlace · ${place.name}`,
    body:
      etaMinutes > 0
        ? `มีโอกาสฝนตกหนักใกล้สถานที่นี้ภายใน ${etaMinutes} นาที`
        : 'มีโอกาสฝนตกหนักใกล้สถานที่นี้ โปรดติดตามสถานการณ์',
  };
}

async function findMatchedPlaces(impact) {
  const candidates = await WatchPlace.find({
    active: true,
    domains: impact.domain,
    location: {
      $near: {
        $geometry: impact.location,
        $maxDistance: impact.radiusMeters + 20000,
      },
    },
  }).lean();

  return candidates.filter((place) => areasIntersect(impact, place));
}

async function runNotificationWorker(now = new Date()) {
  const impacts = await Impact.find({
    status: 'active',
    validUntil: { $gte: now },
  }).lean();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const impact of impacts) {
    const places = await findMatchedPlaces(impact);
    for (const place of places) {
      const existing = await NotificationLog.findOne({
        impactId: impact._id,
        placeId: place._id,
      }).lean();
      if (existing) {
        skipped += 1;
        continue;
      }

      const cooldownFrom = new Date(
        now.getTime() - riskConfig.notifications.cooldownMinutes * 60000,
      );
      const recent = await NotificationLog.findOne({
        placeId: place._id,
        type: impact.type,
        status: 'sent',
        sentAt: { $gte: cooldownFrom },
      }).lean();
      const message = messageForImpact(impact, place);

      if (recent) {
        await NotificationLog.create({
          appInstanceId: place.appInstanceId,
          placeId: place._id,
          impactId: impact._id,
          type: impact.type,
          severity: impact.severity,
          ...message,
          status: 'skipped',
          error: 'cooldown',
        });
        skipped += 1;
        continue;
      }

      const device = await AppDevice.findOne({
        appInstanceId: place.appInstanceId,
      }).lean();
      if (!device) {
        await NotificationLog.create({
          appInstanceId: place.appInstanceId,
          placeId: place._id,
          impactId: impact._id,
          type: impact.type,
          severity: impact.severity,
          ...message,
          status: 'failed',
          error: 'device_not_registered',
        });
        failed += 1;
        continue;
      }

      try {
        const messageId = await sendToToken({
          token: device.fcmToken,
          ...message,
          data: {
            impactId: String(impact._id),
            placeId: String(place._id),
            severity: impact.severity,
          },
        });
        await NotificationLog.create({
          appInstanceId: place.appInstanceId,
          placeId: place._id,
          impactId: impact._id,
          type: impact.type,
          severity: impact.severity,
          ...message,
          status: 'sent',
          messageId,
          sentAt: now,
        });
        sent += 1;
      } catch (error) {
        await NotificationLog.create({
          appInstanceId: place.appInstanceId,
          placeId: place._id,
          impactId: impact._id,
          type: impact.type,
          severity: impact.severity,
          ...message,
          status: 'failed',
          error: error.message,
        });
        failed += 1;
      }
    }
  }

  return { impacts: impacts.length, sent, skipped, failed };
}

module.exports = {
  findMatchedPlaces,
  messageForImpact,
  runNotificationWorker,
};
