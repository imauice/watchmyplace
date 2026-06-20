import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'services/backend_api.dart';
import 'services/notification_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  runApp(const WatchMyPlaceApp());
}

class WatchMyPlaceApp extends StatelessWidget {
  const WatchMyPlaceApp({super.key, this.home});

  final Widget? home;

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF356859);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'WatchMyPlace',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: green),
        scaffoldBackgroundColor: const Color(0xFFF4F7F3),
        useMaterial3: true,
      ),
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

      if (mounted) {
        setState(() => _appInstanceId = appInstanceId);
      }

      final permission = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (permission.authorizationStatus == AuthorizationStatus.denied) {
        throw StateError('ไม่ได้รับอนุญาตให้ส่งการแจ้งเตือน');
      }

      final token = await _messaging.getToken();
      if (token == null) {
        throw StateError('ไม่สามารถรับ FCM token ได้');
      }

      if (mounted) {
        setState(() => _fcmToken = token);
      }

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
          if (mounted) {
            setState(() => _error = error.toString());
          }
        }
      });

      _messageSubscription = FirebaseMessaging.onMessage.listen((message) {
        _notifications.showRemoteMessage(message);
      });

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
    final appInstanceId = _appInstanceId;
    if (appInstanceId == null || _isSending) return;

    setState(() => _isSending = true);

    try {
      await _backend.sendTestNotification(appInstanceId);
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
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  @override
  void dispose() {
    _tokenSubscription?.cancel();
    _messageSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Card(
                elevation: 0,
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(
                        Icons.location_on_rounded,
                        size: 58,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'WatchMyPlace',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'พร้อมเฝ้าสถานที่ของคุณ',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: const Color(0xFF557064)),
                      ),
                      const SizedBox(height: 28),
                      if (_isLoading)
                        const Center(child: CircularProgressIndicator())
                      else ...[
                        _StatusRow(
                          registered: _isRegistered,
                          label: _isRegistered
                              ? 'FCM token registered'
                              : 'Not registered',
                        ),
                        const SizedBox(height: 18),
                        _ValueBlock(
                          label: 'appInstanceId',
                          value: _appInstanceId ?? '-',
                        ),
                        const SizedBox(height: 14),
                        _ValueBlock(
                          label: 'FCM token',
                          value: _fcmToken ?? '-',
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _isRegistered && !_isSending
                              ? _sendTestNotification
                              : null,
                          icon: _isSending
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.notifications_active_outlined),
                          label: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text('ทดสอบแจ้งเตือน'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.registered, required this.label});

  final bool registered;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          registered ? Icons.check_circle : Icons.error_outline,
          color: registered ? const Color(0xFF3B7D65) : Colors.orange,
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(label)),
      ],
    );
  }
}

class _ValueBlock extends StatelessWidget {
  const _ValueBlock({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF2F5F1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: SelectableText(
            value,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
