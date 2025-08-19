import { Loader } from "@googlemaps/js-api-loader";
import KmlMouseEvent = google.maps.KmlMouseEvent;

// --- Types ---
interface LatLngLiteral {
    lat: number;
    lng: number;
}

// --- Globals ---
let map: google.maps.Map;
let userMarker: google.maps.marker.AdvancedMarkerElement | null = null;

// --- API Key ---
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!apiKey) {
    console.error("Missing Google Maps API key.");
    document.getElementById("map")!.innerHTML =
        "Configuration error: Google Maps API key is missing.";
    throw new Error("Missing Google Maps API key");
}

// --- Loader Setup ---
const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["maps", "places", "marker"],
});

// --- App Initialization ---
async function initializeApp() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map container element not found (#map).");
        return;
    }

    try {
        // Load required libraries
        await loader.importLibrary("maps");
        await Promise.all([
            loader.importLibrary("places"),
            loader.importLibrary("marker"),
        ]);

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            mapId: 'TestMap'
        });

        // Request geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                handleGeolocationSuccess,
                handleGeolocationError
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
        }

        // Update marker position on map click
        map.addListener("click", (event: KmlMouseEvent) => {
            if (event.latLng && userMarker) {
                userMarker.position = event.latLng;
            }
        });
    } catch (error) {
        console.error("Error loading Google Maps API or initializing the map:", error);
        mapElement.innerHTML =
            "Error loading map. Please check the console for details.";
    }
}

// --- Geolocation Handlers ---
async function handleGeolocationSuccess(pos: GeolocationPosition) {
    const userLocation: LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };

    // Center map on the user's location and zoom in
    map.setCenter(userLocation);
    map.setZoom(12);

    // Remove existing marker if any, then add the user marker
    if (userMarker) userMarker.map = null;
    userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: userLocation,
        map,
        title: "You are here",
    });

    // Find and display commercial airports nearby
    await findAndDisplayNearbyAirports(userLocation);
}

function handleGeolocationError(error: GeolocationPositionError) {
    console.error("Error getting user location:", error.message);
    const mapElement = document.getElementById("map");
    if (mapElement) {
        const errorDiv = document.createElement("div");
        errorDiv.style.position = "absolute";
        errorDiv.style.top = "10px";
        errorDiv.style.left = "10px";
        errorDiv.style.backgroundColor = "yellow";
        errorDiv.style.padding = "5px";
        errorDiv.style.zIndex = "10";
        errorDiv.textContent = `Could not get location: ${error.message}`;
        mapElement.appendChild(errorDiv);
    }
}

// --- Find and Display Airports ---
async function findAndDisplayNearbyAirports(location: LatLngLiteral) {
    try {
        const airports = await findNearbyAirports(location);
        console.log(`Found ${airports.length} nearby commercial airports.`);

        const airportLocations: LatLngLiteral[] = [];
        airports.forEach((place) => {
            if (place.geometry?.location) {
                // Create a marker for the airport
                new google.maps.marker.AdvancedMarkerElement({
                    position: place.geometry.location,
                    map,
                    title: place.name || "Airport",
                });

                // Prepare for bounds calculation
                airportLocations.push({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        });

        // Adjust map bounds (including the user's location if available)
        if (userMarker?.position) {
            const userPos = userMarker.position as google.maps.LatLngLiteral;
            fitMapToBounds([userPos, ...airportLocations]);
        }
    } catch (error) {
        console.error("Error finding or displaying airports:", error);
    }
}

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
                keyword: "commercial", // This keyword helps narrow for commercial airports
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

// --- Fit Map to Bounds ---
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

// --- Start the Application ---
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
