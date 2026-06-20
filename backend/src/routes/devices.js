const express = require('express');
const AppDevice = require('../models/AppDevice');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { appInstanceId, fcmToken, platform = 'android' } = req.body;

    if (!appInstanceId || !fcmToken) {
      return res.status(400).json({
        error: 'appInstanceId and fcmToken are required',
      });
    }

    const device = await AppDevice.findOneAndUpdate(
      { appInstanceId },
      {
        $set: {
          fcmToken,
          platform,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          appInstanceId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    return res.json({
      registered: true,
      device: {
        appInstanceId: device.appInstanceId,
        platform: device.platform,
        createdAt: device.createdAt,
        lastSeenAt: device.lastSeenAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

