const express = require('express');
const admin = require('firebase-admin');
const AppDevice = require('../models/AppDevice');

const router = express.Router();

router.post('/test', async (req, res, next) => {
  try {
    const { appInstanceId } = req.body;

    if (!appInstanceId) {
      return res.status(400).json({ error: 'appInstanceId is required' });
    }

    const device = await AppDevice.findOne({ appInstanceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const messageId = await admin.messaging().send({
      token: device.fcmToken,
      notification: {
        title: 'WatchMyPlace',
        body: 'ระบบพร้อมเฝ้าสถานที่ของคุณแล้ว',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'watchmyplace_notifications',
        },
      },
    });

    return res.json({ sent: true, messageId });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

