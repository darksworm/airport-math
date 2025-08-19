import { Loader } from "@googlemaps/js-api-loader";

// Define types for better TypeScript support
interface LatLngLiteral {
    lat: number;
    lng: number;
}

// --- Global Variables ---
let map: google.maps.Map;
// Initialize userMarker as null, it will be created when location is found
let userMarker: google.maps.marker.AdvancedMarkerElement | null = null;
let mapElement: HTMLElement | null;

// --- API Key Handling ---
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
    console.error(
        "Google Maps API key is missing. Please create a .env.local file with VITE_GOOGLE_MAPS_API_KEY."
    );
    // Optionally, display an error message to the user on the page
    const mapDiv = document.getElementById("map");
    if (mapDiv) {
        mapDiv.innerHTML =
            "Configuration error: Google Maps API key is missing.";
    }
    // Stop execution if the key is missing
    throw new Error("Missing Google Maps API key");
}

// --- Google Maps API Loader ---
const loader = new Loader({
    apiKey: apiKey,
    version: "weekly",
    // Include all necessary libraries here
    libraries: ["maps", "places", "marker", "routes"],
});

// --- Initialization ---
async function initializeApp() {
    console.log("Initializing application...");
    mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("Map container element not found (#map)");
        return; // Stop if map container doesn't exist
    }

    try {
        // Load the core Maps library first
        await loader.importLibrary("maps");
        console.log("Google Maps library loaded.");

        // Load other libraries needed
        await Promise.all([
            loader.importLibrary("places"),
            loader.importLibrary("marker"),
            loader.importLibrary("routes"), // Needed for DistanceMatrixService
        ]);
        console.log("Places, Marker, and Routes libraries loaded.");

        // Now initialize the map and related features
        await initMap();
        console.log("Map initialized successfully.");
    } catch (error) {
        console.error("Error loading Google Maps API or initializing map:", error);
        if (mapElement) {
            mapElement.innerHTML =
                "Error loading map. Please check the console for details.";
        }
    }
}

async function initMap() {
    if (!mapElement) return; // Should not happen due to check in initializeApp, but good practice

    // Create the map
    map = new google.maps.Map(mapElement, {
        zoom: 10,
        center: { lat: 34.0522, lng: -118.2437 }, // Default center (e.g., Los Angeles)
        mapId: "YOUR_MAP_ID", // Optional: Add a Map ID for Cloud-based styling
    });
    console.log("Map object created.");

    // --- Geolocation ---
    if (navigator.geolocation) {
        console.log("Geolocation is supported. Requesting user location...");
        navigator.geolocation.getCurrentPosition(
            handleGeolocationSuccess, // Success callback
            handleGeolocationError // Error callback
        );
    } else {
        console.warn("Geolocation is not supported by this browser.");
        // Handle lack of geolocation support (e.g., show default view)
    }

    // --- Map Click Listener ---
    map.addListener(
        "click",
        (event: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
            if (event.latLng && userMarker) {
                console.log("Map clicked, moving user marker.");
                userMarker.position = event.latLng; // Update position for AdvancedMarkerElement
                const newLocation: LatLngLiteral = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                };
                // Optionally: Clear old airport markers and find new ones
                // findAndDisplayNearbyAirports(newLocation);
                // Optionally: Recalculate travel times if needed
            }
        }
    );
}

// --- Geolocation Handlers ---
async function handleGeolocationSuccess(pos: GeolocationPosition) {
    const userLocation: LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
    console.log("User location obtained:", userLocation);

    // Center map on user location
    map.setCenter(userLocation);
    map.setZoom(12); // Zoom in a bit more

    // Remove previous marker if it exists
    if (userMarker) {
        userMarker.map = null;
    }

    // Create the user marker
    userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: userLocation,
        map,
        title: "You are here",
        // You can customize the Advanced Marker further if needed
        // content: buildContentElement(), // Example for custom HTML content
    });
    console.log("User marker created.");

    // Find and display nearby airports
    await findAndDisplayNearbyAirports(userLocation);
}

function handleGeolocationError(error: GeolocationPositionError) {
    console.error("Error getting user location:", error.message);
    // Handle errors (e.g., PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)
    // Maybe inform the user or proceed with a default location/view
    if (mapElement) {
        // Simple user feedback
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

// --- Airport Finding and Display ---
async function findAndDisplayNearbyAirports(location: LatLngLiteral) {
    console.log("Finding nearby airports...");
    try {
        const airports = await findNearbyAirports(location);
        console.log(`Found ${airports.length} nearby airports.`);

        // Clear previous airport markers if necessary (add logic to track them)

        const airportLocations: LatLngLiteral[] = [];
        airports.forEach((place) => {
            if (place.geometry?.location) {
                // Create airport marker
                new google.maps.marker.AdvancedMarkerElement({
                    position: place.geometry.location,
                    map,
                    title: place.name || "Airport",
                    // Custom icon for airports using PinElement or SVG
                    // content: createAirportIcon(),
                });
                // Add location for bounds fitting
                airportLocations.push({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        });

        // Fit map bounds if user location and airports are found
        if (userMarker?.position) {
            const userPos = userMarker.position as google.maps.LatLngLiteral; // Type assertion
            fitMapToBounds([userPos, ...airportLocations]);
        }
    } catch (error) {
        console.error("Error finding or displaying airports:", error);
    }
}

function findNearbyAirports(
    location: LatLngLiteral
): Promise<google.maps.places.PlaceResult[]> {
    // Ensure map object is available
    if (!map) {
        return Promise.reject("Map object not initialized");
    }
    const service = new google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
        service.nearbySearch(
            {
                location,
                radius: 50000, // 50km
                type: "airport",
            },
            (results, status, pagination) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    resolve(results);
                } else if (
                    status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
                ) {
                    resolve([]); // No results found is not an error
                } else {
                    console.error("PlacesService nearbySearch failed:", status);
                    reject(`PlacesService Error: ${status}`);
                }
            }
        );
    });
}

// --- Map Utilities ---
function fitMapToBounds(locations: LatLngLiteral[]) {
    if (locations.length === 0) return; // No locations to fit

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((loc) => {
        // Ensure loc is valid before extending bounds
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            bounds.extend(new google.maps.LatLng(loc.lat, loc.lng));
        }
    });

    // Don't zoom in too far if only one point
    if (locations.length > 1) {
        map.fitBounds(bounds, 50); // Add 50px padding
    } else {
        map.setCenter(locations[0]);
        map.setZoom(12); // Or a suitable default zoom for a single point
    }
    console.log("Map bounds adjusted.");
}

// --- Travel Time (Example - Call when needed) ---
function calculateTravelTime(from: LatLngLiteral, to: LatLngLiteral) {
    console.log(`Calculating travel time from ${from.lat},${from.lng} to ${to.lat},${to.lng}`);
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [from],
            destinations: [to],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC, // Or IMPERIAL
        },
        (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && response) {
                try {
                    const element = response.rows[0].elements[0];
                    if (element.status === "OK") {
                        console.log(`Distance: ${element.distance.text}`);
                        console.log(`Duration: ${element.duration.text}`);
                        // Display this information to the user
                    } else {
                        console.warn(`Could not calculate route: ${element.status}`);
                    }
                } catch (e) {
                    console.error("Error processing Distance Matrix response:", e, response);
                }
            } else {
                console.error(`Distance Matrix request failed: ${status}`);
            }
        }
    );
}

// --- Start the Application ---
// Ensure the DOM is ready before trying to find the #map element and init
if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    // `DOMContentLoaded` has already fired
    initializeApp();
}
