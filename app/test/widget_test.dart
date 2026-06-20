import 'package:flutter_test/flutter_test.dart';
import 'package:watchmyplace/main.dart';

void main() {
  testWidgets('shows the WatchMyPlace home screen', (tester) async {
    await tester.pumpWidget(const WatchMyPlaceApp());

    expect(find.text('WatchMyPlace'), findsOneWidget);
    expect(find.text('พร้อมเฝ้าสถานที่ของคุณ'), findsOneWidget);
  });
}
