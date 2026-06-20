const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!configuredPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required');
  }

  const serviceAccountPath = path.resolve(process.cwd(), configuredPath);
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8'),
  );

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = { initializeFirebase };

