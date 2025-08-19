// controls.ts
let travelMode: google.maps.TravelMode;

export function getTravelMode(): google.maps.TravelMode {
    return travelMode;
}

/**
 * Creates travel mode controls (buttons) and returns the container element.
 * When a button is clicked, the onChange callback is triggered with the new travel mode.
 */
export function createTravelModeControls(
    onChange: (newMode: google.maps.TravelMode) => void
): HTMLElement {
    travelMode = google.maps.TravelMode.TRANSIT;

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

    // Set default selection to transit.
    transitBtn.style.backgroundColor = "lightblue";
    travelMode = google.maps.TravelMode.TRANSIT;

    transitBtn.addEventListener("click", () => {
        if (travelMode !== google.maps.TravelMode.TRANSIT) {
            travelMode = google.maps.TravelMode.TRANSIT;
            transitBtn.style.backgroundColor = "lightblue";
            drivingBtn.style.backgroundColor = "";
            onChange(travelMode);
        }
    });

    drivingBtn.addEventListener("click", () => {
        if (travelMode !== google.maps.TravelMode.DRIVING) {
            travelMode = google.maps.TravelMode.DRIVING;
            drivingBtn.style.backgroundColor = "lightblue";
            transitBtn.style.backgroundColor = "";
            onChange(travelMode);
        }
    });

    div.appendChild(transitBtn);
    div.appendChild(drivingBtn);
    return div;
}
