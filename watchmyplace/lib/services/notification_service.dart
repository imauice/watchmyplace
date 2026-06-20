import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static const channel = AndroidNotificationChannel(
    'watchmyplace_notifications',
    'WatchMyPlace notifications',
    description: 'การแจ้งเตือนสำคัญจาก WatchMyPlace',
    importance: Importance.high,
    playSound: true,
  );

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );

    await _notifications.initialize(settings: settings);

    await _notifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);
  }

  Future<void> showRemoteMessage(RemoteMessage message) async {
    final notification = message.notification;

    await _notifications.show(
      id: message.messageId?.hashCode ?? DateTime.now().hashCode,
      title: notification?.title ?? 'WatchMyPlace',
      body: notification?.body ?? 'ระบบพร้อมเฝ้าสถานที่ของคุณแล้ว',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'watchmyplace_notifications',
          'WatchMyPlace notifications',
          channelDescription: 'การแจ้งเตือนสำคัญจาก WatchMyPlace',
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          icon: '@mipmap/ic_launcher',
        ),
      ),
    );
  }
}
