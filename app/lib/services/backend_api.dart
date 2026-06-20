import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class BackendApi {
  BackendApi({
    String baseUrl = const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'http://10.0.2.2:3000',
    ),
  }) : _baseUrl = baseUrl;

  final String _baseUrl;

  Future<void> registerDevice({
    required String appInstanceId,
    required String fcmToken,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/devices/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'appInstanceId': appInstanceId,
        'fcmToken': fcmToken,
        'platform': Platform.isIOS ? 'ios' : 'android',
      }),
    );

    _throwIfFailed(response);
  }

  Future<void> sendTestNotification(String appInstanceId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/notify/test'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'appInstanceId': appInstanceId}),
    );

    _throwIfFailed(response);
  }

  void _throwIfFailed(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) return;

    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw BackendException(
        body['error']?.toString() ?? 'Backend request failed',
        response.statusCode,
      );
    } on FormatException {
      throw BackendException('Backend request failed', response.statusCode);
    }
  }
}

class BackendException implements Exception {
  const BackendException(this.message, this.statusCode);

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}
