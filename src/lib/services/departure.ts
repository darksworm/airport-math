import type { DepartureCalculation, FlightInfo, RouteInfo } from '$lib/types/airport';

/**
 * Calculate when to leave for the airport based on flight info and travel time
 * Formula: leave_time = flight_time - (travel_time + buffer)
 * 
 * @param flightInfo Flight details including time and international status
 * @param routeInfo Travel route information including duration
 * @param safetyMargin Additional minutes to add as safety buffer (default: 15)
 * @returns Complete departure calculation
 */
export function calculateDepartureTime(
	flightInfo: FlightInfo,
	routeInfo: RouteInfo,
	safetyMargin: number = 15
): DepartureCalculation {
	// Parse flight time
	const flightTime = new Date(`${new Date().toDateString()} ${flightInfo.departureTime}`);
	
	// Use 2 hours check-in buffer for all flights
	const checkInBuffer = 2;
	
	// Calculate total minutes needed before flight
	const checkInMinutes = checkInBuffer * 60;
	const travelMinutes = routeInfo.duration;
	const totalMinutesNeeded = checkInMinutes + travelMinutes + safetyMargin;
	
	// Calculate leave time
	const leaveTime = new Date(flightTime.getTime() - (totalMinutesNeeded * 60 * 1000));
	
	// Calculate when you need to arrive at airport (flight time - check-in buffer)
	const arrivalDeadline = new Date(flightTime.getTime() - (checkInMinutes * 60 * 1000));
	
	return {
		flightTime,
		checkInBuffer,
		travelTime: travelMinutes,
		leaveTime,
		arrivalDeadline
	};
}

/**
 * Calculate departure times for multiple transport options
 * @param flightInfo Flight details
 * @param routes Array of route options
 * @param safetyMargin Safety margin in minutes
 * @returns Array of departure calculations for each route
 */
export function calculateMultipleDepartureTimes(
	flightInfo: FlightInfo,
	routes: RouteInfo[],
	safetyMargin: number = 15
): (DepartureCalculation & { route: RouteInfo })[] {
	return routes.map(route => ({
		...calculateDepartureTime(flightInfo, route, safetyMargin),
		route
	}));
}

/**
 * Format time for display
 * @param date Date object to format
 * @param options Formatting options
 * @returns Formatted time string
 */
export function formatTime(date: Date, options: {
	includeDate?: boolean;
	use24Hour?: boolean;
} = {}): string {
	const { includeDate = false, use24Hour = false } = options;
	
	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: 'numeric',
		minute: '2-digit',
		hour12: !use24Hour
	};
	
	if (includeDate) {
		timeOptions.weekday = 'short';
		timeOptions.month = 'short';
		timeOptions.day = 'numeric';
	}
	
	return date.toLocaleString('en-US', timeOptions);
}

/**
 * Check if departure time is in the past
 * @param leaveTime Calculated leave time
 * @returns True if you should have already left
 */
export function isDepartureOverdue(leaveTime: Date): boolean {
	return leaveTime.getTime() < Date.now();
}

/**
 * Get time until departure
 * @param leaveTime Calculated leave time
 * @returns Object with hours and minutes until departure
 */
export function getTimeUntilDeparture(leaveTime: Date): {
	hours: number;
	minutes: number;
	totalMinutes: number;
	isOverdue: boolean;
} {
	const now = new Date();
	const diff = leaveTime.getTime() - now.getTime();
	const isOverdue = diff < 0;
	const absDiff = Math.abs(diff);
	
	const totalMinutes = Math.floor(absDiff / (1000 * 60));
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	
	return {
		hours,
		minutes,
		totalMinutes,
		isOverdue
	};
}

/**
 * Generate a summary of the departure calculation
 * @param calculation Departure calculation result
 * @returns Human-readable summary
 */
export function getDepartureSummary(calculation: DepartureCalculation): string {
	const timeUntil = getTimeUntilDeparture(calculation.leaveTime);
	
	if (timeUntil.isOverdue) {
		return `⚠️ You should have left ${timeUntil.hours}h ${timeUntil.minutes}m ago!`;
	} else if (timeUntil.totalMinutes < 60) {
		return `🚨 Leave in ${timeUntil.totalMinutes} minutes!`;
	} else {
		return `⏰ Leave in ${timeUntil.hours}h ${timeUntil.minutes}m`;
	}
}

/**
 * Validate flight time
 * @param timeString Time string in HH:MM format
 * @returns True if valid
 */
export function isValidFlightTime(timeString: string): boolean {
	const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
	return timeRegex.test(timeString);
}