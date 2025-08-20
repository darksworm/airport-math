import type { DepartureCalculation, FlightInfo, RouteInfo, DeparturePreferences } from '$lib/types/airport';

/**
 * Calculate baggage processing time based on preferences and safety level
 */
function calculateBaggageTime(hasCheckedBags: boolean, safetyLevel: number): number {
	if (!hasCheckedBags) return 0;
	
	// Base time for baggage: 10-30 minutes depending on safety level
	const baseTime = 10;
	const safetyMultiplier = safetyLevel * 4; // 0-20 minutes extra (level 0-5)
	return Math.round(baseTime + safetyMultiplier);
}

/**
 * Calculate security and passport time based on preferences and safety level
 */
function calculateSecurityTime(needsPassport: boolean, safetyLevel: number): { security: number, passport: number } {
	// Security time: 10-45 minutes depending on safety level (0-5)
	const baseSecurityTime = 10;
	const securitySafetyMultiplier = safetyLevel * 7; // 0-35 minutes extra
	const securityTime = Math.round(baseSecurityTime + securitySafetyMultiplier);
	
	// Passport control time: 10-40 minutes if needed
	let passportTime = 0;
	if (needsPassport) {
		const basePassportTime = 10;
		const passportSafetyMultiplier = safetyLevel * 6; // 0-30 minutes extra
		passportTime = Math.round(basePassportTime + passportSafetyMultiplier);
	}
	
	return { security: securityTime, passport: passportTime };
}

/**
 * Calculate gate wait time based on safety level (replaces fixed 2h check-in buffer)
 */
function calculateGateWaitTime(safetyLevel: number): number {
	// Gate wait time based on safety level:
	// Level 0: 10 minutes (ain't nobody got time)
	// Level 1: 30 minutes (aggressive)
	// Level 2: 45 minutes (confident)
	// Level 3: 60 minutes (moderate)
	// Level 4: 90 minutes (conservative)
	// Level 5: 120 minutes (very safe)
	
	const gateWaitTimes = [10, 30, 45, 60, 90, 120];
	return gateWaitTimes[Math.min(safetyLevel, 5)];
}

/**
 * Calculate safety buffer based on safety level
 */
function calculateSafetyBuffer(safetyLevel: number): number {
	// Safety buffer: 0-25 minutes based on level (0-5)
	const levelMultiplier = safetyLevel * 5; // 0-25 minutes
	return levelMultiplier;
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
	
	// Calculate each component
	const travelMinutes = routeInfo.duration;
	const baggageTime = calculateBaggageTime(prefs.hasCheckedBags, prefs.safetyMarginLevel);
	const { security: securityTime, passport: passportTime } = calculateSecurityTime(prefs.needsPassportControl, prefs.safetyMarginLevel);
	const gateWaitTime = calculateGateWaitTime(prefs.safetyMarginLevel);
	const safetyBuffer = calculateSafetyBuffer(prefs.safetyMarginLevel);
	
	// Total buffer time (everything except travel)
	const totalBuffer = gateWaitTime + baggageTime + securityTime + passportTime + safetyBuffer + prefs.additionalBuffer;
	
	// Calculate total time needed before flight
	const totalMinutesNeeded = travelMinutes + totalBuffer;
	
	// Calculate leave time
	const leaveTime = new Date(flightTime.getTime() - (totalMinutesNeeded * 60 * 1000));
	
	// Calculate when you need to arrive at airport (flight time - gate wait time)
	const arrivalDeadline = new Date(flightTime.getTime() - (gateWaitTime * 60 * 1000));
	
	return {
		flightTime,
		checkInBuffer: gateWaitTime / 60, // Convert to hours for compatibility
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
			checkIn: gateWaitTime,
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