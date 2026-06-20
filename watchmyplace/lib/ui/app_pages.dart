import 'package:flutter/material.dart';

const ink = Color(0xFF102D2B);
const green = Color(0xFF08745F);
const brightGreen = Color(0xFF2EAC54);
const muted = Color(0xFF687382);
const line = Color(0xFFE3E8E6);
const surface = Color(0xFFF8FAF9);

ThemeData buildWatchMyPlaceTheme() {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: green, surface: Colors.white),
    scaffoldBackgroundColor: Colors.white,
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        color: ink,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.8,
      ),
      headlineSmall: TextStyle(color: ink, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(color: ink, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: muted, height: 1.5),
      bodyMedium: TextStyle(color: muted, height: 1.5),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(textStyle: const TextStyle()),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    useMaterial3: true,
  );
}

class PlacesPage extends StatelessWidget {
  const PlacesPage({
    super.key,
    required this.isReady,
    required this.onOpenAlerts,
    required this.onOpenSettings,
    required this.onAddPlace,
    required this.onWatchGuide,
  });

  final bool isReady;
  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenSettings;
  final VoidCallback onAddPlace;
  final VoidCallback onWatchGuide;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _HomeHeader(
              onOpenAlerts: onOpenAlerts,
              onOpenSettings: onOpenSettings,
            ),
            const SizedBox(height: 15),
            _ReadyBanner(isReady: isReady),
            const SizedBox(height: 20),
            const _EmptyPlaceIllustration(),
            const SizedBox(height: 14),
            Text(
              'ยังไม่ได้ปักหมุดสถานที่',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontSize: 21),
            ),
            const SizedBox(height: 5),
            Text(
              'เพิ่มสถานที่ที่คุณสนใจ\nให้เราช่วยเฝ้าและแจ้งเมื่อมีสิ่งผิดปกติ',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(fontSize: 15, height: 1.35),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: onAddPlace,
              style: FilledButton.styleFrom(
                backgroundColor: green,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: const Icon(Icons.add, size: 25),
              label: const Text(
                'ปักหมุดสถานที่ใหม่',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: onWatchGuide,
              style: OutlinedButton.styleFrom(
                foregroundColor: muted,
                side: const BorderSide(color: Color(0xFFD4DADF)),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: const Icon(Icons.play_circle_outline),
              label: const Text(
                'ดูวิธีใช้งาน (1 นาที)',
                style: TextStyle(fontSize: 15),
              ),
            ),
            const SizedBox(height: 18),
            const _PopularPlacesCard(),
          ],
        ),
      ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.onOpenAlerts, required this.onOpenSettings});

  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'WatchMyPlace',
                style: Theme.of(
                  context,
                ).textTheme.headlineLarge?.copyWith(fontSize: 29),
              ),
              const SizedBox(height: 1),
              Text(
                'ปักหมุดไว้ ที่เหลือเราจะเฝ้าให้',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(fontSize: 14),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Alerts',
          onPressed: onOpenAlerts,
          icon: const Icon(Icons.notifications_none_rounded, size: 27),
          color: ink,
        ),
        IconButton(
          tooltip: 'Settings',
          onPressed: onOpenSettings,
          icon: const Icon(Icons.settings_outlined, size: 27),
          color: ink,
        ),
      ],
    );
  }
}

class _ReadyBanner extends StatelessWidget {
  const _ReadyBanner({required this.isReady});

  final bool isReady;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 124,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF2FAF5), Color(0xFFEAF8EF)],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFD8EDDF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140D5D49),
            blurRadius: 16,
            offset: Offset(0, 7),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          const Positioned.fill(
            child: CustomPaint(painter: _LandscapePainter()),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(15, 16, 14, 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(17),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x170B513F),
                        blurRadius: 13,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(
                    isReady ? Icons.verified_user_rounded : Icons.sync_rounded,
                    color: isReady ? brightGreen : Colors.orange,
                    size: 33,
                  ),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isReady ? 'วันนี้ทุกที่ยังปกติดี' : 'กำลังเตรียมระบบ',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: green,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        isReady
                            ? 'ใช้ชีวิตได้ตามปกติ เราจะแจ้งเมื่อจำเป็นจริง ๆ'
                            : 'กำลังเชื่อมต่อระบบแจ้งเตือน',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 12.5,
                          height: 1.3,
                          color: const Color(0xFF596A66),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LandscapePainter extends CustomPainter {
  const _LandscapePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final back = Paint()..color = const Color(0xB3CEEFD7);
    final front = Paint()..color = const Color(0xA691DDA5);
    final city = Paint()..color = const Color(0xA6BCE7C7);

    for (final building in [
      Rect.fromLTWH(size.width * .48, size.height * .7, 18, size.height * .3),
      Rect.fromLTWH(size.width * .57, size.height * .62, 24, size.height * .38),
      Rect.fromLTWH(size.width * .74, size.height * .57, 28, size.height * .43),
    ]) {
      canvas.drawRect(building, city);
    }

    final backPath = Path()
      ..moveTo(0, size.height * .82)
      ..quadraticBezierTo(
        size.width * .13,
        size.height * .55,
        size.width * .28,
        size.height * .82,
      )
      ..quadraticBezierTo(
        size.width * .5,
        size.height * .55,
        size.width * .68,
        size.height * .79,
      )
      ..quadraticBezierTo(
        size.width * .84,
        size.height * .65,
        size.width,
        size.height * .75,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(backPath, back);

    final frontPath = Path()
      ..moveTo(0, size.height * .9)
      ..quadraticBezierTo(
        size.width * .25,
        size.height * .72,
        size.width * .47,
        size.height * .94,
      )
      ..quadraticBezierTo(
        size.width * .7,
        size.height * .73,
        size.width,
        size.height * .87,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(frontPath, front);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _EmptyPlaceIllustration extends StatelessWidget {
  const _EmptyPlaceIllustration();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 122,
        height: 122,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [Color(0xFFF1F3F6), Color(0xFFFAFBFC)],
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(
              bottom: 22,
              child: Transform.rotate(
                angle: -.12,
                child: Container(
                  width: 84,
                  height: 37,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6E9ED),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const Positioned(
              top: 23,
              child: Icon(
                Icons.location_on_rounded,
                size: 65,
                color: Color(0xFF9FA9B5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PopularPlacesCard extends StatelessWidget {
  const _PopularPlacesCard();

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.home_outlined, 'บ้าน'),
      (Icons.apartment_outlined, 'โรงเรียน'),
      (Icons.work_outline, 'ที่ทำงาน'),
      (Icons.storefront_outlined, 'ร้านค้า'),
    ];
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline, color: green, size: 23),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ตัวอย่างสถานที่ที่นิยมปักหมุด',
                  style: TextStyle(
                    color: ink,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: items
                .map(
                  (item) => Column(
                    children: [
                      Icon(item.$1, color: muted, size: 28),
                      const SizedBox(height: 5),
                      Text(
                        item.$2,
                        style: const TextStyle(color: muted, fontSize: 12),
                      ),
                    ],
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class AlertsPage extends StatelessWidget {
  const AlertsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _EmptyPage(
      icon: Icons.notifications_none_rounded,
      title: 'ยังไม่มีการแจ้งเตือน',
      description: 'เมื่อมีเหตุการณ์สำคัญ\nการแจ้งเตือนจะปรากฏที่นี่',
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({
    super.key,
    required this.isLoading,
    required this.isRegistered,
    required this.isSending,
    required this.appInstanceId,
    required this.fcmToken,
    required this.error,
    required this.onSendTest,
  });

  final bool isLoading;
  final bool isRegistered;
  final bool isSending;
  final String? appInstanceId;
  final String? fcmToken;
  final String? error;
  final VoidCallback onSendTest;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Settings',
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontSize: 34),
            ),
            const SizedBox(height: 5),
            const Text('ตั้งค่าและตรวจสอบระบบแจ้งเตือน'),
            const SizedBox(height: 27),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Icon(
                        isRegistered
                            ? Icons.check_circle_rounded
                            : Icons.error_outline_rounded,
                        color: isRegistered ? brightGreen : Colors.orange,
                        size: 29,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Push notification',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              isLoading
                                  ? 'กำลังตรวจสอบ...'
                                  : isRegistered
                                  ? 'พร้อมใช้งาน'
                                  : 'ยังไม่พร้อม',
                              style: const TextStyle(color: muted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 30),
                  _SettingsValue(
                    label: 'appInstanceId',
                    value: appInstanceId ?? '-',
                  ),
                  const SizedBox(height: 18),
                  _SettingsValue(label: 'FCM token', value: fcmToken ?? '-'),
                  if (error != null) ...[
                    const SizedBox(height: 18),
                    Text(
                      error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: isRegistered && !isSending ? onSendTest : null,
              style: FilledButton.styleFrom(
                backgroundColor: green,
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: isSending
                  ? const SizedBox.square(
                      dimension: 19,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.notifications_active_outlined),
              label: const Text(
                'ทดสอบแจ้งเตือน',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'ระบบจะส่งการแจ้งเตือนจริงมายังอุปกรณ์เครื่องนี้',
              textAlign: TextAlign.center,
              style: TextStyle(color: muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsValue extends StatelessWidget {
  const _SettingsValue({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 7),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: line),
          ),
          child: SelectableText(
            value,
            style: const TextStyle(color: muted, fontSize: 12),
          ),
        ),
      ],
    );
  }
}

class _EmptyPage extends StatelessWidget {
  const _EmptyPage({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 110,
                height: 110,
                decoration: const BoxDecoration(
                  color: Color(0xFFF0F5F3),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 54, color: green),
              ),
              const SizedBox(height: 24),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Text(
                description,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
