import {Loader} from "@googlemaps/js-api-loader";
import KmlMouseEvent = google.maps.KmlMouseEvent;

// --- Types ---
interface LatLngLiteral {
    lat: number;
    lng: number;
}

// --- Globals ---
let map: google.maps.Map;
let userMarker: google.maps.marker.AdvancedMarkerElement | null = null;
let currentUserLocation: LatLngLiteral | null = null;

// Global travel mode (default: public transport via TRANSIT)
let currentTravelMode: google.maps.TravelMode;

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
        await loader.importLibrary("maps");
        await Promise.all([
            loader.importLibrary("places"),
            loader.importLibrary("marker"),
        ]);

        // default travel mode
        currentTravelMode = google.maps.TravelMode.TRANSIT;

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            mapId: "TestMap",
        });

        // Add travel mode controls at the top center of the map.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(
            createTravelModeControls()
        );

        // Request geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                handleGeolocationSuccess,
                handleGeolocationError
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
        }

        // Map click listener for updating the user marker (if not clicking on an airport).
        map.addListener("click", (event: KmlMouseEvent) => {
            if (event.latLng && userMarker) {
                userMarker.position = event.latLng;
                currentUserLocation = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                };
            }
        });
    } catch (error) {
        console.error(
            "Error loading Google Maps API or initializing the map:",
            error
        );
        mapElement.innerHTML =
            "Error loading map. Please check the console for details.";
    }
}

function handleGeolocationSuccess(pos: GeolocationPosition) {
    const userLocation: LatLngLiteral = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
    currentUserLocation = userLocation;

    map.setCenter(userLocation);
    map.setZoom(12);

    if (userMarker) userMarker.map = null;

    userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: userLocation,
        map,
        title: "You are here",
        content: createUserMarker(),
    });

    // Once the user's location is established, search for nearby airports.
    findAndDisplayNearbyAirports(userLocation);
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

/**
 * Calculates the travel time from the current user location to the airport,
 * using the currently selected travel mode.
 */
function calculateTravelTime(from: LatLngLiteral, to: LatLngLiteral): void {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [from],
            destinations: [to],
            travelMode: currentTravelMode,
            unitSystem: google.maps.UnitSystem.METRIC,
            transitOptions: {
                modes: [
                    google.maps.TransitMode.SUBWAY,
                    google.maps.TransitMode.BUS,
                    google.maps.TransitMode.TRAIN,
                    google.maps.TransitMode.RAIL,
                    google.maps.TransitMode.TRAM
                ]
            },
            drivingOptions: {
                departureTime: new Date()
            }
        },
        (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && response) {
                try {
                    console.log(response, status);
                    const element = response.rows[0].elements[0];
                    if (element.status === "OK") {
                        console.log(
                            `Travel time (${currentTravelMode}): ${element.duration.text}`
                        );
                        // Optionally, update the UI with the travel time.
                    } else {
                        console.warn(`Could not calculate route: ${element.status}`);
                    }
                } catch (e) {
                    console.error(
                        "Error processing Distance Matrix response:",
                        e,
                        response
                    );
                }
            } else {
                console.error(`Distance Matrix request failed: ${status}`);
            }
        }
    );
}

/**
 * Creates the custom user marker.
 */
function createUserMarker(): HTMLElement {
    const markerContainer = document.createElement("div");
    markerContainer.style.position = "relative";
    markerContainer.style.width = "20px";
    markerContainer.style.height = "20px";

    const indicator = document.createElement("div");
    indicator.style.position = "absolute";
    indicator.style.top = "50%";
    indicator.style.left = "50%";
    indicator.style.transform = "translate(-50%, -50%)";
    indicator.style.background = "#2196F3";
    indicator.style.border = "2px solid white";
    indicator.style.borderRadius = "50%";
    indicator.style.width = "20px";
    indicator.style.height = "20px";
    indicator.style.boxShadow = "0 0 4px rgba(0, 0, 0, 0.3)";

    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = "100%";
    label.style.left = "50%";
    label.style.transform = "translateX(-50%)";
    label.style.whiteSpace = "nowrap";
    label.style.background = "white";
    label.style.color = "#333";
    label.style.fontSize = "12px";
    label.style.padding = "2px 4px";
    label.style.borderRadius = "4px";
    label.style.marginTop = "4px";
    label.textContent = "You are here";

    markerContainer.appendChild(indicator);
    markerContainer.appendChild(label);

    return markerContainer;
}

// Global reference for the active airport marker container.
let activeAirportMarkerContainer: HTMLElement | null = null;

/**
 * Updates the styling for an airport marker's indicator.
 * When active, the inside color becomes green.
 */
function setAirportMarkerActive(
    container: HTMLElement,
    active: boolean
): void {
    const innerContainer = container.firstElementChild as HTMLElement;
    if (!innerContainer) return;
    const indicator = innerContainer.firstElementChild as HTMLElement;
    if (indicator) {
        if (active) {
            indicator.style.background = "green";
            indicator.style.border = "2px solid white";
            indicator.style.boxShadow = "0 0 8px green";
        } else {
            indicator.style.background = "#E91E63";
            indicator.style.border = "2px solid white";
            indicator.style.boxShadow = "0 0 4px rgba(0, 0, 0, 0.3)";
        }
    }
}

/**
 * Creates a custom airport marker element with a larger clickable area.
 *
 * @param airportName The airport's name (or code) to display.
 * @param airportPosition The position of the airport.
 * @returns The HTMLElement for the airport marker.
 */
function createAirportMarker(
    airportName: string,
    airportPosition: LatLngLiteral
): HTMLElement {
    const markerContainer = document.createElement("div");
    markerContainer.style.position = "relative";
    markerContainer.style.width = "40px"; // Larger clickable area.
    markerContainer.style.height = "40px";
    markerContainer.style.backgroundColor = "transparent";
    markerContainer.style.cursor = "pointer";

    // Store airport position in data attributes.
    markerContainer.dataset.lat = airportPosition.lat.toString();
    markerContainer.dataset.lng = airportPosition.lng.toString();

    const innerContainer = document.createElement("div");
    innerContainer.style.position = "absolute";
    innerContainer.style.width = "20px";
    innerContainer.style.height = "20px";
    innerContainer.style.top = "50%";
    innerContainer.style.left = "50%";
    innerContainer.style.transform = "translate(-50%, -50%)";

    const indicator = document.createElement("div");
    indicator.style.background = "#E91E63";
    indicator.style.border = "2px solid white";
    indicator.style.borderRadius = "50%";
    indicator.style.width = "20px";
    indicator.style.height = "20px";
    indicator.style.boxShadow = "0 0 4px rgba(0, 0, 0, 0.3)";
    innerContainer.appendChild(indicator);

    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = "100%";
    label.style.left = "50%";
    label.style.transform = "translateX(-50%)";
    label.style.whiteSpace = "nowrap";
    label.style.background = "rgba(255, 255, 255, 0.8)";
    label.style.color = "#333";
    label.style.fontSize = "12px";
    label.style.padding = "1px 3px";
    label.style.borderRadius = "3px";
    label.style.marginTop = "2px";
    label.textContent = airportName;
    innerContainer.appendChild(label);

    markerContainer.appendChild(innerContainer);
    markerContainer.title = airportName;

    markerContainer.addEventListener("click", (event) => {
        event.stopPropagation();
        if (
            activeAirportMarkerContainer &&
            activeAirportMarkerContainer !== markerContainer
        ) {
            setAirportMarkerActive(activeAirportMarkerContainer, false);
        }
        const isAlreadyActive = activeAirportMarkerContainer === markerContainer;
        if (!isAlreadyActive) {
            setAirportMarkerActive(markerContainer, true);
            activeAirportMarkerContainer = markerContainer;
            const lat = parseFloat(markerContainer.dataset.lat!);
            const lng = parseFloat(markerContainer.dataset.lng!);
            if (currentUserLocation) {
                calculateTravelTime(currentUserLocation, { lat, lng });
            }
        }
    });

    return markerContainer;
}

/**
 * Searches for nearby airports and displays markers for them.
 */
async function findAndDisplayNearbyAirports(location: LatLngLiteral) {
    try {
        const airports = await findNearbyAirports(location);
        console.log(`Found ${airports.length} nearby commercial airports.`);
        const airportLocations: LatLngLiteral[] = [];

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
                    content: createAirportMarker(place.name || "Airport", pos),
                });
                airportLocations.push(pos);
            }
        });

        if (userMarker?.position) {
            const userPos = userMarker.position as google.maps.LatLngLiteral;
            fitMapToBounds([userPos, ...airportLocations]);
        }
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

/**
 * Creates travel mode controls (buttons) and places them atop the map.
 */
function createTravelModeControls(): HTMLElement {
    const controlDiv = document.createElement("div");
    controlDiv.style.backgroundColor = "white";
    controlDiv.style.border = "2px solid rgba(0, 0, 0, 0.2)";
    controlDiv.style.borderRadius = "3px";
    controlDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    controlDiv.style.margin = "10px";
    controlDiv.style.padding = "5px";
    controlDiv.style.display = "flex";
    controlDiv.style.gap = "5px";

    const transitBtn = document.createElement("button");
    transitBtn.textContent = "Public Transport";
    const drivingBtn = document.createElement("button");
    drivingBtn.textContent = "Driving";

    // Set default selection to Public Transport.
    transitBtn.style.backgroundColor = "lightblue";
    currentTravelMode = google.maps.TravelMode.TRANSIT;

    transitBtn.addEventListener("click", () => {
        currentTravelMode = google.maps.TravelMode.TRANSIT;
        transitBtn.style.backgroundColor = "lightblue";
        drivingBtn.style.backgroundColor = "";
        // Optionally, re-calculate travel time for the active airport if desired.
    });

    drivingBtn.addEventListener("click", () => {
        currentTravelMode = google.maps.TravelMode.DRIVING;
        drivingBtn.style.backgroundColor = "lightblue";
        transitBtn.style.backgroundColor = "";
    });

    controlDiv.appendChild(transitBtn);
    controlDiv.appendChild(drivingBtn);

    return controlDiv;
}

// --- Start the Application ---
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
