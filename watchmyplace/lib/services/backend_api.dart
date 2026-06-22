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

  Future<List<WatchPlace>> getWatchPlaces(String appInstanceId) async {
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
    return places
        .map((item) => WatchPlace.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
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

class WatchPlace {
  const WatchPlace({
    required this.id,
    required this.name,
    required this.placeType,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    required this.domains,
    required this.updatedAt,
  });

  factory WatchPlace.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>? ?? const {};
    final coordinates = location['coordinates'] as List<dynamic>? ?? const [];

    return WatchPlace(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'สถานที่',
      placeType: json['placeType']?.toString() ?? 'other',
      longitude: coordinates.isNotEmpty
          ? (coordinates[0] as num).toDouble()
          : 0,
      latitude: coordinates.length > 1 ? (coordinates[1] as num).toDouble() : 0,
      radiusMeters: (json['radiusMeters'] as num?)?.toDouble() ?? 500,
      domains: (json['domains'] as List<dynamic>? ?? const [])
          .map((domain) => domain.toString())
          .toList(growable: false),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? ''),
    );
  }

  final String id;
  final String name;
  final String placeType;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final List<String> domains;
  final DateTime? updatedAt;
}

class BackendException implements Exception {
  const BackendException(this.message);

  final String message;

  @override
  String toString() => message;
}
