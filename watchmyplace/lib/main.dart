import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'services/backend_api.dart';
import 'services/notification_service.dart';
import 'ui/app_pages.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
      systemNavigationBarDividerColor: Colors.transparent,
    ),
  );
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  runApp(const WatchMyPlaceApp());
}

class WatchMyPlaceApp extends StatelessWidget {
  const WatchMyPlaceApp({super.key, this.home});

  final Widget? home;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'WatchMyPlace',
      theme: buildWatchMyPlaceTheme(),
      home: home ?? const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final BackendApi _backend = BackendApi();
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final NotificationService _notifications = NotificationService();

  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<RemoteMessage>? _messageSubscription;
  int _selectedIndex = 0;
  String? _appInstanceId;
  String? _fcmToken;
  String? _error;
  bool _isLoading = true;
  bool _isRegistered = false;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await _notifications.initialize();
      final preferences = await SharedPreferences.getInstance();
      var appInstanceId = preferences.getString('appInstanceId');
      if (appInstanceId == null) {
        appInstanceId = const Uuid().v4();
        await preferences.setString('appInstanceId', appInstanceId);
      }

      if (mounted) setState(() => _appInstanceId = appInstanceId);

      final permission = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (permission.authorizationStatus == AuthorizationStatus.denied) {
        throw StateError('ไม่ได้รับอนุญาตให้ส่งการแจ้งเตือน');
      }

      final token = await _messaging.getToken();
      if (token == null) throw StateError('ไม่สามารถรับ FCM token ได้');
      if (mounted) setState(() => _fcmToken = token);

      await _registerDevice(appInstanceId, token);
      _tokenSubscription = _messaging.onTokenRefresh.listen((newToken) async {
        try {
          await _registerDevice(appInstanceId!, newToken);
          if (mounted) {
            setState(() {
              _fcmToken = newToken;
              _isRegistered = true;
              _error = null;
            });
          }
        } catch (error) {
          if (mounted) setState(() => _error = error.toString());
        }
      });
      _messageSubscription = FirebaseMessaging.onMessage.listen(
        _notifications.showRemoteMessage,
      );

      if (mounted) {
        setState(() {
          _isRegistered = true;
          _isLoading = false;
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _registerDevice(String appInstanceId, String token) {
    return _backend.registerDevice(
      appInstanceId: appInstanceId,
      fcmToken: token,
    );
  }

  Future<void> _sendTestNotification() async {
    if (_appInstanceId == null || _isSending) return;
    setState(() => _isSending = true);
    try {
      await _backend.sendTestNotification(_appInstanceId!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ส่งการแจ้งเตือนทดสอบแล้ว')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('ส่งไม่สำเร็จ: $error')));
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _comingSoon(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _tokenSubscription?.cancel();
    _messageSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      PlacesPage(
        isReady: _isRegistered,
        onOpenAlerts: () => setState(() => _selectedIndex = 1),
        onOpenSettings: () => setState(() => _selectedIndex = 2),
        onAddPlace: () => _comingSoon('ฟีเจอร์ปักหมุดสถานที่จะมาในขั้นถัดไป'),
        onWatchGuide: () => _comingSoon('คู่มือใช้งานกำลังจัดทำ'),
      ),
      const AlertsPage(),
      SettingsPage(
        isLoading: _isLoading,
        isRegistered: _isRegistered,
        isSending: _isSending,
        appInstanceId: _appInstanceId,
        fcmToken: _fcmToken,
        error: _error,
        onSendTest: _sendTestNotification,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        height: 74,
        selectedIndex: _selectedIndex,
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE6F5EA),
        onDestinationSelected: (index) {
          setState(() => _selectedIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.location_on_outlined),
            selectedIcon: Icon(Icons.location_on),
            label: 'Places',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Alerts',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
