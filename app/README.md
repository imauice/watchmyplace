# WatchMyPlace Flutter app

Minimal Flutter client that creates an anonymous app instance ID, registers its
FCM token with the backend, and requests a test notification.

## Firebase setup

1. Create Android and iOS apps in the same Firebase project used by the backend.
2. Use Android package name `com.watchmyplace.watchmyplace`.
3. Download `google-services.json` to:
   `android/app/google-services.json`.
4. For iOS, download `GoogleService-Info.plist` to:
   `ios/Runner/GoogleService-Info.plist`.
5. In Xcode, enable **Push Notifications** and
   **Background Modes > Remote notifications** for Runner.
6. Upload an APNs authentication key or certificate in Firebase for iOS.

The Firebase configuration files are intentionally ignored by Git.

## Run

The default backend URL is `http://10.0.2.2:3000`, which reaches the host
machine from an Android emulator.

```powershell
flutter run
```

For a physical device, use your computer's LAN IP:

```powershell
flutter run --dart-define=BACKEND_URL=http://192.168.1.10:3000
```

For the iOS simulator:

```powershell
flutter run --dart-define=BACKEND_URL=http://localhost:3000
```

Use HTTPS for production deployments.

