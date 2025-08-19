import { LatLngLiteral } from "./markers"; // Assumes your markers module exports this type
import { createAirportMarkerElement } from "./markers";

/**
 * Performs a nearby search for commercial airports using the PlacesService.
 * @param map - The map instance.
 * @param location - The origin location.
 * @returns A promise that resolves to an array of PlaceResult objects.
 */
export function findNearbyAirports(
    map: google.maps.Map,
    location: LatLngLiteral
): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(map);
        service.nearbySearch(
            {
                location,
                radius: 50000, // 50km radius
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
                    resolve([]); // No results is not an error.
                } else {
                    console.error("PlacesService nearbySearch failed:", status);
                    reject(`PlacesService Error: ${status}`);
                }
            }
        );
    });
}

/**
 * Searches for nearby airports and displays markers for them.
 * @param map - The map instance.
 * @param location - The origin location.
 * @returns A promise that resolves to an array of LatLngLiteral locations (including the origin and each airport).
 */
export async function findAndDisplayNearbyAirports(
    map: google.maps.Map,
    location: LatLngLiteral,
): Promise<LatLngLiteral[]> {
    try {
        const airports = await findNearbyAirports(map, location);
        console.log(`Found ${airports.length} nearby commercial airports.`);
        const locs: LatLngLiteral[] = [location];

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
                locs.push(pos);
            }
        });
        return locs;
    } catch (error) {
        console.error("Error finding or displaying airports:", error);
        return [];
    }
}
