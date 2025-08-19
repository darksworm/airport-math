import type { RouteInfo, TransportMode } from '$lib/types/airport';

export const TRANSPORT_MODES: TransportMode[] = [
	{
		id: 'driving-car',
		name: 'Driving',
		icon: '🚗',
		description: 'Drive your own car'
	},
	{
		id: 'foot-walking',
		name: 'Walking',
		icon: '🚶',
		description: 'Walk to the airport'
	},
	{
		id: 'cycling-regular',
		name: 'Cycling',
		icon: '🚴',
		description: 'Bike to the airport'
	},
	{
		id: 'public-transport',
		name: 'Public Transit',
		icon: '🚌',
		description: 'Use public transportation'
	}
];

/**
 * Calculate route using OSRM demo server
 * Note: In production, you should run your own OSRM instance
 * @param fromLat Starting latitude
 * @param fromLng Starting longitude
 * @param toLat Destination latitude
 * @param toLng Destination longitude
 * @param mode Transport mode
 * @returns Route information including duration and distance
 */
export async function calculateRoute(
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number,
	mode: TransportMode
): Promise<RouteInfo> {
	try {
		// Use OSRM demo server for car routing
		// Note: The demo server only supports car routing
		if (mode.id === 'driving-car') {
			const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&steps=true`;
			
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`OSRM API error: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
				throw new Error('No route found');
			}
			
			const route = data.routes[0];
			
			return {
				duration: Math.round(route.duration / 60), // Convert seconds to minutes
				distance: route.distance, // meters
				mode,
				instructions: route.legs[0]?.steps?.map((step: any) => step.maneuver.instruction) || []
			};
		} else {
			// For other modes, use estimated calculations
			return calculateEstimatedRoute(fromLat, fromLng, toLat, toLng, mode);
		}
	} catch (error) {
		console.error('Routing error:', error);
		// Fallback to estimated route
		return calculateEstimatedRoute(fromLat, fromLng, toLat, toLng, mode);
	}
}

/**
 * Calculate estimated route when API is unavailable
 * Uses straight-line distance with mode-specific speed assumptions
 */
function calculateEstimatedRoute(
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number,
	mode: TransportMode
): RouteInfo {
	// Calculate straight-line distance using Haversine formula
	const R = 6371000; // Earth's radius in meters
	const dLat = (toLat - fromLat) * Math.PI / 180;
	const dLng = (toLng - fromLng) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const straightLineDistance = R * c; // meters

	// Apply mode-specific factors
	const modeFactors = {
		'driving-car': { speedKmh: 50, distanceFactor: 1.3 }, // Roads add ~30% distance
		'cycling-regular': { speedKmh: 15, distanceFactor: 1.2 }, // Bike paths add ~20%
		'foot-walking': { speedKmh: 5, distanceFactor: 1.15 }, // Walking paths add ~15%
		'public-transport': { speedKmh: 25, distanceFactor: 1.5 } // Includes transfers, waiting
	};

	const factor = modeFactors[mode.id as keyof typeof modeFactors] || modeFactors['driving-car'];
	const adjustedDistance = straightLineDistance * factor.distanceFactor;
	const durationMinutes = (adjustedDistance / 1000) / factor.speedKmh * 60;

	return {
		duration: Math.round(durationMinutes),
		distance: Math.round(adjustedDistance),
		mode,
		instructions: [`Estimated ${mode.name.toLowerCase()} route to airport`]
	};
}

/**
 * Calculate multiple routes for different transport modes
 * @param fromLat Starting latitude
 * @param fromLng Starting longitude
 * @param toLat Destination latitude
 * @param toLng Destination longitude
 * @param modes Array of transport modes to calculate
 * @returns Promise resolving to array of route information
 */
export async function calculateMultipleRoutes(
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number,
	modes: TransportMode[] = TRANSPORT_MODES
): Promise<RouteInfo[]> {
	const routePromises = modes.map(mode => 
		calculateRoute(fromLat, fromLng, toLat, toLng, mode)
	);
	
	try {
		return await Promise.all(routePromises);
	} catch (error) {
		console.error('Error calculating multiple routes:', error);
		// Return empty array on error
		return [];
	}
}

/**
 * Format duration for display
 * @param minutes Duration in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${minutes}m`;
	}
	
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	
	if (mins === 0) {
		return `${hours}h`;
	}
	
	return `${hours}h ${mins}m`;
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string with appropriate units
 */
export function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${Math.round(meters)}m`;
	} else if (meters < 10000) {
		return `${(meters / 1000).toFixed(1)}km`;
	} else {
		return `${Math.round(meters / 1000)}km`;
	}
}