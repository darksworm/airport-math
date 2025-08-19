import {Loader} from "@googlemaps/js-api-loader";
import {markerEvents, updateUserMarker,} from "./markers";
import {createTravelModeControls, getTravelMode} from "./controls";
import {findAndDisplayNearbyAirports} from "./airportFinder";
import KmlMouseEvent = google.maps.KmlMouseEvent;

// Globals for our map and travel mode.
let map: google.maps.Map;
let currentUserLocation: google.maps.LatLngLiteral | null = null;
// We'll always use the travel mode defined in controls.ts

let directionsRenderer: google.maps.DirectionsRenderer | null = null;
// We'll keep track of the currently selected airport (its location) to re-calc the route.
let activeAirportLocation: google.maps.LatLngLiteral | null = null;

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!apiKey) {
    console.error("Missing Google Maps API key.");
    document.getElementById("map")!.innerHTML =
        "Configuration error: Google Maps API key is missing.";
    throw new Error("Missing Google Maps API key");
}

const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["maps", "places", "marker"],
});

async function initializeApp() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map container not found.");
        return;
    }
    try {
        await loader.importLibrary("maps");
        await Promise.all([
            loader.importLibrary("places"),
            loader.importLibrary("marker"),
        ]);

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            mapId: "TestMap",
        });

        // Add travel mode controls to the top center of the map.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(
            createTravelModeControls((newMode: google.maps.TravelMode) => {
                // If an airport is selected, re-calculate the route.
                if (currentUserLocation && activeAirportLocation) {
                    showRoute(currentUserLocation, activeAirportLocation, newMode);
                }
            })
        );

        // Initialize the DirectionsRenderer.
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        // Listen to marker events.
        setupMarkerEvents();

        // Request geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                handleGeolocationSuccess,
                handleGeolocationError
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
        }

        // Map click listener to update the user marker.
        map.addListener("click", (event: KmlMouseEvent) => {
            if (event.latLng) {
                const loc = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                currentUserLocation = loc;
                updateUserMarker(map, loc);
            }
        });
    } catch (error) {
        console.error("Error initializing map:", error);
        mapElement.innerHTML =
            "Error loading map. Please check the console for details.";
    }
}

function handleGeolocationSuccess(pos: GeolocationPosition) {
    const location: google.maps.LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
    currentUserLocation = location;
    map.setCenter(location);
    map.setZoom(12);
    updateUserMarker(map, location);
    // Trigger nearby airports search.
    findAndDisplayNearbyAirports(map, currentUserLocation);
}

function handleGeolocationError(error: GeolocationPositionError) {
    console.error("Error getting user location:", error.message);
    const mapElement = document.getElementById("map");
    if (mapElement) {
        mapElement.innerHTML = `Could not get location: ${error.message}`;
    }
}

/**
 * Listens to marker events. When an airport is selected,
 * stores its location and shows the route.
 */
function setupMarkerEvents() {
    markerEvents.addEventListener("airportSelected", (e: Event) => {
        const detail = (e as CustomEvent).detail;
        console.log("Airport selected:", detail);
        activeAirportLocation = detail.location;
        if (currentUserLocation && activeAirportLocation) {
            showRoute(currentUserLocation, activeAirportLocation, getTravelMode());
        }
    });
}

/**
 * Calculates and displays a route on the map using the Directions Service.
 */
function showRoute(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral, travelMode: google.maps.TravelMode) {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
        {
            origin: from,
            destination: to,
            travelMode: travelMode,
            ...(travelMode === google.maps.TravelMode.TRANSIT && {
                transitOptions: {departureTime: new Date()},
            }),
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer?.setDirections(result);
            } else {
                console.error("Directions request failed:", status);
            }
        }
    );
}

// Start the application.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
