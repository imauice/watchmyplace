# WatchMyPlace backend

Minimal Express backend for anonymous Firebase Cloud Messaging device
registration and test notifications.

## Prerequisites

- Node.js 20 or newer
- MongoDB
- A Firebase project with Cloud Messaging enabled
- A Firebase Admin SDK service account JSON file

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env`.

3. Download a Firebase service account JSON from Firebase Console:
   **Project settings > Service accounts > Generate new private key**.

4. Save it as `service-account.json` in this folder, or update
   `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`.

5. Start MongoDB and run:

   ```powershell
   npm run dev
   ```

The server defaults to `http://localhost:3000`.

## Endpoints

- `GET /health`
- `POST /devices/register`

  ```json
  {
    "appInstanceId": "anonymous-uuid",
    "fcmToken": "firebase-token",
    "platform": "android"
  }
  ```

- `POST /notify/test`

  ```json
  {
    "appInstanceId": "anonymous-uuid"
  }
  ```

## Test

```powershell
npm test
```
