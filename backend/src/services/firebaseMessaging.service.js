const admin = require('firebase-admin');

async function sendToToken({ token, title, body, data = {} }) {
  return admin.messaging().send({
    token,
    notification: { title, body },
    data,
    android: {
      priority: 'high',
      notification: { channelId: 'watchmyplace_notifications' },
    },
  });
}

module.exports = { sendToToken };
