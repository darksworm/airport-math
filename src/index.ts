import {Loader} from "@googlemaps/js-api-loader";
import {createAirportMarkerElement, LatLngLiteral, markerEvents, updateUserMarker} from "./markers";
import KmlMouseEvent = google.maps.KmlMouseEvent;

// Globals for our map and travel mode.
let map: google.maps.Map;
let currentUserLocation: LatLngLiteral | null = null;
let currentTravelMode: google.maps.TravelMode; // Set after the maps API has loaded.

let directionsRenderer: google.maps.DirectionsRenderer | null = null;

// API key and Loader setup.
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

        // Now we can safely assign travel mode.
        currentTravelMode = google.maps.TravelMode.TRANSIT;

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            mapId: "TestMap",
        });

        // Add travel mode controls at the top center.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(createTravelModeControls());

        // Initialize the DirectionsRenderer.
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        // Set up marker events.
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
        mapElement.innerHTML = "Error loading map. Please check the console for details.";
    }
}

function handleGeolocationSuccess(pos: GeolocationPosition) {
    const location: LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
    currentUserLocation = location;
    findAndDisplayNearbyAirports(currentUserLocation);
    map.setCenter(location);
    map.setZoom(12);
    updateUserMarker(map, location);
    // Once user location is set, you might trigger a nearby search for airport markers.
    // For simplicity, we assume those markers are added in some other function.
}

/**
 * Adjusts the map bounds to fit given locations.
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

function handleGeolocationError(error: GeolocationPositionError) {
    console.error("Error getting user location:", error.message);
    const mapElement = document.getElementById("map");
    if (mapElement) {
        mapElement.innerHTML = `Could not get location: ${error.message}`;
    }
}

/**
 * Listen to marker events.
 */
function setupMarkerEvents() {
    markerEvents.addEventListener("airportSelected", (e: Event) => {
        const eventDetail = (e as CustomEvent).detail;
        console.log("Airport selected:", eventDetail);
        if (currentUserLocation && eventDetail.location) {
            showRoute(currentUserLocation, eventDetail.location);
        }
    });
}

/**
 * Use the Directions Service to calculate and display a route on the map.
 */
function showRoute(from: LatLngLiteral, to: LatLngLiteral) {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
        {
            origin: from,
            destination: to,
            travelMode: currentTravelMode,
            // Pass in the departure time when transit is used.
            ...(currentTravelMode === google.maps.TravelMode.TRANSIT && {transitOptions: {departureTime: new Date()}}),
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
 * Creates travel mode controls (buttons) to toggle between TRANSIT and DRIVING.
 */
function createTravelModeControls(): HTMLElement {
    const div = document.createElement("div");
    div.style.backgroundColor = "white";
    div.style.border = "2px solid rgba(0, 0, 0, 0.2)";
    div.style.borderRadius = "3px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    div.style.margin = "10px";
    div.style.padding = "5px";
    div.style.display = "flex";
    div.style.gap = "5px";

    const transitBtn = document.createElement("button");
    transitBtn.textContent = "Public Transport";
    const drivingBtn = document.createElement("button");
    drivingBtn.textContent = "Driving";

    // Default selection for transit.
    transitBtn.style.backgroundColor = "lightblue";
    currentTravelMode = google.maps.TravelMode.TRANSIT;

    transitBtn.addEventListener("click", () => {
        currentTravelMode = google.maps.TravelMode.TRANSIT;
        transitBtn.style.backgroundColor = "lightblue";
        drivingBtn.style.backgroundColor = "";
    });

    drivingBtn.addEventListener("click", () => {
        currentTravelMode = google.maps.TravelMode.DRIVING;
        drivingBtn.style.backgroundColor = "lightblue";
        transitBtn.style.backgroundColor = "";
    });

    div.appendChild(transitBtn);
    div.appendChild(drivingBtn);
    return div;
}

/**
 * Searches for nearby airports and displays markers for them.
 */
async function findAndDisplayNearbyAirports(location: LatLngLiteral) {
    try {
        const airports = await findNearbyAirports(location);
        console.log(`Found ${airports.length} nearby commercial airports.`);
        let locations: google.maps.LatLngLiteral[] = [location];

        airports.forEach((place) => {
            if (place.geometry?.location) {
                const pos: LatLngLiteral = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                new google.maps.marker.AdvancedMarkerElement({
                    position: place.geometry.location,
                    map,
                    title: place.name || "Airport",
                    content: createAirportMarkerElement(place.name || "Airport", pos),
                });

                locations.push({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        });

        fitMapToBounds(locations);
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

// Start application.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
