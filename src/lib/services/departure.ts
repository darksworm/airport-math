import type { DepartureCalculation, FlightInfo, RouteInfo, DeparturePreferences } from '$lib/types/airport';

/**
 * Calculate baggage processing time based on preferences and safety level
 */
function calculateBaggageTime(hasCheckedBags: boolean, safetyLevel: number): number {
	if (!hasCheckedBags) return 0;
	
	// Base time for baggage: 15-30 minutes depending on safety level
	const baseTime = 15;
	const safetyMultiplier = (safetyLevel - 1) * 3.75; // 0-15 minutes extra
	return Math.round(baseTime + safetyMultiplier);
}

/**
 * Calculate security and passport time based on preferences and safety level
 */
function calculateSecurityTime(needsPassport: boolean, safetyLevel: number): { security: number, passport: number } {
	// Base security time: 15-45 minutes depending on safety level
	const baseSecurityTime = 15;
	const securitySafetyMultiplier = (safetyLevel - 1) * 7.5; // 0-30 minutes extra
	const securityTime = Math.round(baseSecurityTime + securitySafetyMultiplier);
	
	// Passport control time: 20-45 minutes if needed
	let passportTime = 0;
	if (needsPassport) {
		const basePassportTime = 20;
		const passportSafetyMultiplier = (safetyLevel - 1) * 6.25; // 0-25 minutes extra
		passportTime = Math.round(basePassportTime + passportSafetyMultiplier);
	}
	
	return { security: securityTime, passport: passportTime };
}

/**
 * Calculate safety buffer based on safety level
 */
function calculateSafetyBuffer(safetyLevel: number): number {
	// Safety buffer: 5-25 minutes based on level
	const baseBuffer = 5;
	const levelMultiplier = (safetyLevel - 1) * 5; // 0-20 minutes extra
	return baseBuffer + levelMultiplier;
}

/**
 * Calculate when to leave for the airport with detailed preferences
 * 
 * @param flightInfo Flight details including departure time
 * @param routeInfo Travel route information including duration
 * @param preferences User preferences for baggage, passport, safety level, etc.
 * @returns Complete departure calculation with detailed breakdown
 */
export function calculateDepartureTime(
	flightInfo: FlightInfo,
	routeInfo: RouteInfo,
	preferences?: DeparturePreferences
): DepartureCalculation {
	// Parse flight time
	const flightTime = new Date(`${new Date().toDateString()} ${flightInfo.departureTime}`);
	
	// Use default preferences if none provided
	const prefs = preferences || {
		hasCheckedBags: false,
		needsPassportControl: false,
		safetyMarginLevel: 3,
		additionalBuffer: 0
	};
	
	// Base check-in buffer: 2 hours for all flights
	const checkInBuffer = 2;
	const checkInMinutes = checkInBuffer * 60;
	
	// Calculate each component
	const travelMinutes = routeInfo.duration;
	const baggageTime = calculateBaggageTime(prefs.hasCheckedBags, prefs.safetyMarginLevel);
	const { security: securityTime, passport: passportTime } = calculateSecurityTime(prefs.needsPassportControl, prefs.safetyMarginLevel);
	const safetyBuffer = calculateSafetyBuffer(prefs.safetyMarginLevel);
	
	// Total buffer time (everything except travel)
	const totalBuffer = checkInMinutes + baggageTime + securityTime + passportTime + safetyBuffer + prefs.additionalBuffer;
	
	// Calculate total time needed before flight
	const totalMinutesNeeded = travelMinutes + totalBuffer;
	
	// Calculate leave time
	const leaveTime = new Date(flightTime.getTime() - (totalMinutesNeeded * 60 * 1000));
	
	// Calculate when you need to arrive at airport (flight time - check-in buffer)
	const arrivalDeadline = new Date(flightTime.getTime() - (checkInMinutes * 60 * 1000));
	
	return {
		flightTime,
		checkInBuffer,
		travelTime: travelMinutes,
		baggageTime,
		securityTime,
		passportTime,
		safetyBuffer,
		totalBuffer,
		leaveTime,
		arrivalDeadline,
		breakdown: {
			travel: travelMinutes,
			checkIn: checkInMinutes,
			baggage: baggageTime,
			security: securityTime,
			passport: passportTime,
			safety: safetyBuffer + prefs.additionalBuffer
		}
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