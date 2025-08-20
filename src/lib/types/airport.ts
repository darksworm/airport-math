export interface Airport {
	id: string;
	name: string;
	city: string;
	country: string;
	iata: string;
	icao: string;
	latitude: number;
	longitude: number;
	elevation: number;
	timezone: string;
	type: 'large_airport' | 'medium_airport'; // Only commercial passenger airports
	distance?: number; // Distance from user location in km
}

export interface NearbyAirportsResult {
	airports: Airport[];
	userLocation: {
		lat: number;
		lng: number;
	};
}

export interface FlightInfo {
	departureTime: string;
	selectedAirport: Airport | null;
}

export interface TransportMode {
	id: string;
	name: string;
	icon: string;
	description: string;
}

export interface RouteInfo {
	duration: number; // in minutes
	distance: number; // in meters
	mode: TransportMode;
	instructions?: string[];
}

export interface DeparturePreferences {
	hasCheckedBags: boolean;
	needsPassportControl: boolean;
	safetyMarginLevel: number; // 1-5 scale (1=aggressive, 5=very conservative)
	additionalBuffer: number; // extra minutes user wants
}

export interface DepartureCalculation {
	flightTime: Date;
	checkInBuffer: number; // hours
	travelTime: number; // minutes
	baggageTime: number; // minutes
	securityTime: number; // minutes
	passportTime: number; // minutes
	safetyBuffer: number; // minutes
	totalBuffer: number; // minutes
	leaveTime: Date;
	arrivalDeadline: Date;
	breakdown: {
		travel: number;
		checkIn: number;
		baggage: number;
		security: number;
		passport: number;
		safety: number;
	};
}