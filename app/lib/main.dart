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
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  runApp(const WatchMyPlaceApp());
}

class WatchMyPlaceApp extends StatelessWidget {
  const WatchMyPlaceApp({super.key});

  @override
  Widget build(BuildContext context) {
    const seedColor = Color(0xFF356859);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'WatchMyPlace',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF4F7F3),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final BackendApi _backendApi = BackendApi();
  final NotificationService _notificationService = NotificationService();

  StreamSubscription<String>? _tokenSubscription;
  String? _appInstanceId;
  String? _fcmToken;
  String? _errorMessage;
  bool _isInitializing = true;
  bool _isRegistered = false;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await Firebase.initializeApp();
      await _notificationService.initialize();

      final preferences = await SharedPreferences.getInstance();
      var appInstanceId = preferences.getString('appInstanceId');
      if (appInstanceId == null) {
        appInstanceId = const Uuid().v4();
        await preferences.setString('appInstanceId', appInstanceId);
      }

      if (mounted) {
        setState(() => _appInstanceId = appInstanceId);
      }

      final token = await _notificationService.requestPermissionAndGetToken();
      if (token == null) {
        throw StateError('ไม่สามารถรับ FCM token ได้');
      }

      if (mounted) {
        setState(() => _fcmToken = token);
      }

      await _backendApi.registerDevice(
        appInstanceId: appInstanceId,
        fcmToken: token,
      );

      _tokenSubscription = _notificationService.tokenRefreshes.listen((
        newToken,
      ) async {
        await _backendApi.registerDevice(
          appInstanceId: appInstanceId!,
          fcmToken: newToken,
        );
        if (mounted) {
          setState(() {
            _fcmToken = newToken;
            _isRegistered = true;
          });
        }
      });

      if (mounted) {
        setState(() {
          _appInstanceId = appInstanceId;
          _fcmToken = token;
          _isRegistered = true;
          _isInitializing = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _errorMessage = error.toString();
          _isInitializing = false;
        });
      }
    }
  }

  Future<void> _sendTestNotification() async {
    final appInstanceId = _appInstanceId;
    if (appInstanceId == null || _isSending) return;

    setState(() => _isSending = true);
    try {
      await _backendApi.sendTestNotification(appInstanceId);
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

  @override
  void dispose() {
    _tokenSubscription?.cancel();
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
                        size: 56,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: 16),
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
                      if (_isInitializing)
                        const Center(child: CircularProgressIndicator())
                      else ...[
                        _StatusRow(
                          label: 'การลงทะเบียน',
                          value: _isRegistered
                              ? 'FCM token registered'
                              : 'Not registered',
                          isSuccess: _isRegistered,
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
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            _errorMessage!,
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
  const _StatusRow({
    required this.label,
    required this.value,
    required this.isSuccess,
  });

  final String label;
  final String value;
  final bool isSuccess;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          isSuccess ? Icons.check_circle : Icons.error_outline,
          color: isSuccess ? const Color(0xFF3B7D65) : Colors.orange,
        ),
        const SizedBox(width: 10),
        Expanded(child: Text('$label: $value')),
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
