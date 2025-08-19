import { Loader } from "@googlemaps/js-api-loader";
import KmlMouseEvent = google.maps.KmlMouseEvent;
import {
    createAirportMarkerElement,
    LatLngLiteral,
    markerEvents,
    updateUserMarker,
} from "./markers";
import { createTravelModeControls, travelMode as controlsTravelMode } from "./controls";

// Globals for our map and travel mode.
let map: google.maps.Map;
let currentUserLocation: LatLngLiteral | null = null;
// We'll always use the travel mode defined in controls.ts
let currentTravelMode = controlsTravelMode;

let directionsRenderer: google.maps.DirectionsRenderer | null = null;
// We'll keep track of the currently selected airport (its location) to re-calc the route.
let activeAirportLocation: LatLngLiteral | null = null;

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

        // Now safe to assign default travel mode.
        currentTravelMode = controlsTravelMode;

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            mapId: "TestMap",
        });

        // Add travel mode controls to the top center of the map.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(
            createTravelModeControls((newMode: google.maps.TravelMode) => {
                currentTravelMode = newMode;
                // If an airport is selected, re-calculate the route.
                if (currentUserLocation && activeAirportLocation) {
                    showRoute(currentUserLocation, activeAirportLocation);
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
                const loc = { lat: event.latLng.lat(), lng: event.latLng.lng() };
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
    const location: LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
    currentUserLocation = location;
    map.setCenter(location);
    map.setZoom(12);
    updateUserMarker(map, location);
    // Trigger nearby airports search.
    findAndDisplayNearbyAirports(location);
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
            showRoute(currentUserLocation, activeAirportLocation);
        }
    });
}

/**
 * Calculates and displays a route on the map using the Directions Service.
 */
function showRoute(from: LatLngLiteral, to: LatLngLiteral) {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
        {
            origin: from,
            destination: to,
            travelMode: currentTravelMode,
            ...(currentTravelMode === google.maps.TravelMode.TRANSIT && {
                transitOptions: { departureTime: new Date() },
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

/**
 * Adjusts map bounds to fit given locations.
 */
function fitMapToBounds(locations: LatLngLiteral[]) {
    if (locations.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    locations.forEach((loc) => {
        bounds.extend(new google.maps.LatLng(loc.lat, loc.lng));
    });
    if (locations.length > 1) {
        map.fitBounds(bounds, 50);
    } else {
        map.setCenter(locations[0]);
        map.setZoom(12);
    }
}

/**
 * Searches for nearby airports and displays markers for each.
 */
async function findAndDisplayNearbyAirports(location: LatLngLiteral) {
    try {
        const airports = await findNearbyAirports(location);
        console.log(`Found ${airports.length} nearby commercial airports.`);
        const locs: LatLngLiteral[] = [location];

        airports.forEach((place) => {
            if (place.geometry?.location) {
                const pos: LatLngLiteral = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                // Here we call the imported createAirportMarkerElement function.
                new google.maps.marker.AdvancedMarkerElement({
                    position: place.geometry.location,
                    map,
                    title: place.name || "Airport",
                    content: createAirportMarkerElement(place.name || "Airport", pos),
                });
                locs.push(pos);
            }
        });
        fitMapToBounds(locs);
    } catch (error) {
        console.error("Error finding or displaying airports:", error);
    }
}

/**
 * Performs a nearby search for commercial airports.
 */
function findNearbyAirports(
    location: LatLngLiteral
): Promise<google.maps.places.PlaceResult[]> {
    if (!map) return Promise.reject("Map object not initialized");
    const service = new google.maps.places.PlacesService(map);
    return new Promise((resolve, reject) => {
        service.nearbySearch(
            {
                location,
                radius: 50000, // 50km
                type: "airport",
                keyword: "commercial",
            },
            (results, status) => {
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results
                ) {
                    resolve(results);
                } else if (
                    status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
                ) {
                    resolve([]);
                } else {
                    console.error("PlacesService nearbySearch failed:", status);
                    reject(`PlacesService Error: ${status}`);
                }
            }
        );
    });
}

// Start the application.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
