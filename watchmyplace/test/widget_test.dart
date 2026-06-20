import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:watchmyplace/main.dart';

void main() {
  testWidgets('shows WatchMyPlace branding', (tester) async {
    await tester.pumpWidget(
      const WatchMyPlaceApp(
        home: Scaffold(
          body: Column(
            children: [Text('WatchMyPlace'), Text('พร้อมเฝ้าสถานที่ของคุณ')],
          ),
        ),
      ),
    );

    expect(find.text('WatchMyPlace'), findsOneWidget);
    expect(find.text('พร้อมเฝ้าสถานที่ของคุณ'), findsOneWidget);
  });
}
