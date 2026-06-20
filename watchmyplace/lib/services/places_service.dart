import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class PlacesService {
  static const _channel = MethodChannel('watchmyplace/places');

  Future<List<PlaceSuggestion>> autocomplete(String query) async {
    final results = await _channel.invokeListMethod<Map<Object?, Object?>>(
      'autocomplete',
      {'query': query},
    );
    return (results ?? []).map(PlaceSuggestion.fromMap).toList(growable: false);
  }

  Future<PlaceSelection> getDetails(String placeId) async {
    final result = await _channel.invokeMapMethod<Object?, Object?>(
      'placeDetails',
      {'placeId': placeId},
    );
    if (result == null) throw StateError('ไม่พบข้อมูลสถานที่');
    return PlaceSelection.fromMap(result);
  }
}

class PlaceSuggestion {
  const PlaceSuggestion({
    required this.placeId,
    required this.primaryText,
    required this.secondaryText,
  });

  factory PlaceSuggestion.fromMap(Map<Object?, Object?> map) {
    return PlaceSuggestion(
      placeId: map['placeId']?.toString() ?? '',
      primaryText: map['primaryText']?.toString() ?? '',
      secondaryText: map['secondaryText']?.toString() ?? '',
    );
  }

  final String placeId;
  final String primaryText;
  final String secondaryText;
}

class PlaceSelection {
  const PlaceSelection({
    required this.position,
    required this.name,
    required this.address,
  });

  factory PlaceSelection.fromMap(Map<Object?, Object?> map) {
    return PlaceSelection(
      position: LatLng(
        (map['latitude'] as num).toDouble(),
        (map['longitude'] as num).toDouble(),
      ),
      name: map['name']?.toString() ?? '',
      address: map['address']?.toString() ?? '',
    );
  }

  final LatLng position;
  final String name;
  final String address;
}
