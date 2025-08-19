// markers.ts
export interface LatLngLiteral {
    lat: number;
    lng: number;
}

// Create an EventTarget to dispatch marker-related events.
export const markerEvents = new EventTarget();

// --- Marker Module State ---
let currentUserMarker: google.maps.marker.AdvancedMarkerElement | null = null;
let currentUserLocation: LatLngLiteral | null = null;

/**
 * Create a user marker element.
 */
export function createUserMarkerElement(): HTMLElement {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "20px";
    container.style.height = "20px";

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
    indicator.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";

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

    container.appendChild(indicator);
    container.appendChild(label);
    return container;
}

/**
 * Create an airport marker element.
 * When clicked it dispatches an "airportSelected" event with detail {airportName, location}.
 */
export function createAirportMarkerElement(place: google.maps.places.PlaceResult): HTMLElement {
    const markerContainer = document.createElement("div");
    markerContainer.style.position = "relative";
    markerContainer.style.width = "40px"; // Larger click area.
    markerContainer.style.height = "40px";
    markerContainer.style.backgroundColor = "transparent";
    markerContainer.style.cursor = "pointer";

    const innerContainer = document.createElement("div");
    innerContainer.style.position = "absolute";
    innerContainer.style.width = "20px";
    innerContainer.style.height = "20px";
    innerContainer.style.top = "50%";
    innerContainer.style.left = "50%";
    innerContainer.style.transform = "translate(-50%, -50%)";

    // The indicator circle (red by default)
    const indicator = document.createElement("div");
    indicator.style.background = "#E91E63";
    indicator.style.border = "2px solid white";
    indicator.style.borderRadius = "50%";
    indicator.style.width = "20px";
    indicator.style.height = "20px";
    indicator.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
    innerContainer.appendChild(indicator);

    // Label shows airport code or name.
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = "100%";
    label.style.left = "50%";
    label.style.transform = "translateX(-50%)";
    label.style.whiteSpace = "nowrap";
    label.style.background = "rgba(255,255,255,0.8)";
    label.style.color = "#333";
    label.style.fontSize = "12px";
    label.style.padding = "1px 3px";
    label.style.borderRadius = "3px";
    label.style.marginTop = "2px";
    label.textContent = place.name ?? "unknown airport";
    innerContainer.appendChild(label);

    markerContainer.appendChild(innerContainer);
    markerContainer.title = place.name ?? "unknown airport";

    // When clicked, dispatch an event with the airport details.
    markerContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        const lat = parseFloat(markerContainer.dataset.lat!);
        const lng = parseFloat(markerContainer.dataset.lng!);
        markerEvents.dispatchEvent(
            new CustomEvent("airportSelected", {
                detail: { place: place },
            })
        );
    });

    return markerContainer;
}

/**
 * Update the user marker – either create it if it doesn't exist, or update its position.
 * Also dispatches a "userLocationChanged" event.
 */
export function updateUserMarker(map: google.maps.Map, location: LatLngLiteral): void {
    currentUserLocation = location;
    if (currentUserMarker) {
        currentUserMarker.position = location;
    } else {
        currentUserMarker = new google.maps.marker.AdvancedMarkerElement({
            position: location,
            map,
            title: "You are here",
            content: createUserMarkerElement(),
        });
    }
    markerEvents.dispatchEvent(
        new CustomEvent("userLocationChanged", { detail: { location } })
    );
}
