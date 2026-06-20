package com.watchmyplace.watchmyplace

import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "watchmyplace/places"
    private var sessionToken = AutocompleteSessionToken.newInstance()

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        if (!Places.isInitialized()) {
            Places.initializeWithNewPlacesApiEnabled(
                applicationContext,
                BuildConfig.MAPS_API_KEY,
            )
        }
        val placesClient = Places.createClient(this)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "autocomplete" -> {
                    val query = call.argument<String>("query").orEmpty().trim()
                    if (query.length < 2) {
                        result.success(emptyList<Map<String, String>>())
                        return@setMethodCallHandler
                    }

                    val request = FindAutocompletePredictionsRequest.builder()
                        .setQuery(query)
                        .setCountries("TH")
                        .setSessionToken(sessionToken)
                        .build()

                    placesClient.findAutocompletePredictions(request)
                        .addOnSuccessListener { response ->
                            result.success(
                                response.autocompletePredictions.map {
                                    mapOf(
                                        "placeId" to it.placeId,
                                        "primaryText" to it.getPrimaryText(null).toString(),
                                        "secondaryText" to it.getSecondaryText(null).toString(),
                                    )
                                },
                            )
                        }
                        .addOnFailureListener { error ->
                            result.error("places_autocomplete", error.message, null)
                        }
                }

                "placeDetails" -> {
                    val placeId = call.argument<String>("placeId")
                    if (placeId.isNullOrBlank()) {
                        result.error("invalid_place", "placeId is required", null)
                        return@setMethodCallHandler
                    }

                    val fields = listOf(
                        Place.Field.ID,
                        Place.Field.DISPLAY_NAME,
                        Place.Field.FORMATTED_ADDRESS,
                        Place.Field.LOCATION,
                    )
                    val request = FetchPlaceRequest.builder(placeId, fields)
                        .setSessionToken(sessionToken)
                        .build()

                    placesClient.fetchPlace(request)
                        .addOnSuccessListener { response ->
                            val place = response.place
                            val location = place.location
                            result.success(
                                mapOf(
                                    "placeId" to place.id,
                                    "name" to place.displayName,
                                    "address" to place.formattedAddress,
                                    "latitude" to location?.latitude,
                                    "longitude" to location?.longitude,
                                ),
                            )
                            sessionToken = AutocompleteSessionToken.newInstance()
                        }
                        .addOnFailureListener { error ->
                            result.error("place_details", error.message, null)
                        }
                }

                else -> result.notImplemented()
            }
        }
    }
}
