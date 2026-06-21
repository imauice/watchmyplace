import 'dart:convert';

import 'package:http/http.dart' as http;

class BackendApi {
  BackendApi({
    String baseUrl = const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'http://127.0.0.1:3000',
    ),
  }) : _baseUrl = baseUrl;

  final String _baseUrl;

  Future<void> registerDevice({
    required String appInstanceId,
    required String fcmToken,
  }) async {
    final response = await http
        .post(
          Uri.parse('$_baseUrl/devices/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'appInstanceId': appInstanceId,
            'fcmToken': fcmToken,
            'platform': 'android',
          }),
        )
        .timeout(const Duration(seconds: 15));

    _throwIfFailed(response);
  }

  Future<void> sendTestNotification(String appInstanceId) async {
    final response = await http
        .post(
          Uri.parse('$_baseUrl/notify/test'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'appInstanceId': appInstanceId}),
        )
        .timeout(const Duration(seconds: 15));

    _throwIfFailed(response);
  }

  Future<void> createWatchPlace({
    required String appInstanceId,
    required String name,
    required String placeType,
    required double latitude,
    required double longitude,
    required double radiusMeters,
    required List<String> domains,
  }) async {
    final response = await http
        .post(
          Uri.parse('$_baseUrl/v1/watch-places'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'appInstanceId': appInstanceId,
            'name': name,
            'placeType': placeType,
            'location': {
              'type': 'Point',
              'coordinates': [longitude, latitude],
            },
            'radiusMeters': radiusMeters,
            'domains': domains,
          }),
        )
        .timeout(const Duration(seconds: 15));

    _throwIfFailed(response);
  }

  Future<bool> hasWatchPlaces(String appInstanceId) async {
    final response = await http
        .get(
          Uri.parse(
            '$_baseUrl/v1/watch-places'
            '?appInstanceId=${Uri.encodeQueryComponent(appInstanceId)}',
          ),
        )
        .timeout(const Duration(seconds: 15));

    _throwIfFailed(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final places = body['places'] as List<dynamic>? ?? const [];
    return places.isNotEmpty;
  }

  void _throwIfFailed(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) return;

    var message = 'Backend request failed (${response.statusCode})';
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      message = body['error']?.toString() ?? message;
    } on FormatException {
      // Keep the status-based fallback message.
    }

    throw BackendException(message);
  }
}

class BackendException implements Exception {
  const BackendException(this.message);

  final String message;

  @override
  String toString() => message;
}
