/**
 * Calculate the great circle distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Radius of the Earth in kilometers
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c; // Distance in kilometers
	return distance;
}

function deg2rad(deg: number): number {
	return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string with appropriate units
 */
export function formatDistance(distanceKm: number): string {
	if (distanceKm < 1) {
		return `${Math.round(distanceKm * 1000)}m`;
	} else if (distanceKm < 10) {
		return `${distanceKm.toFixed(1)}km`;
	} else {
		return `${Math.round(distanceKm)}km`;
	}
}