import type { Airport, NearbyAirportsResult } from '$lib/types/airport';
import { calculateDistance } from '$lib/utils/distance';

// Sample airport data - in a real app, this would come from OurAirports dataset
// https://datahub.io/core/airport-codes
const AIRPORT_DATA: Omit<Airport, 'distance'>[] = [
	{
		id: 'LAX',
		name: 'Los Angeles International Airport',
		city: 'Los Angeles',
		country: 'United States',
		iata: 'LAX',
		icao: 'KLAX',
		latitude: 33.9425,
		longitude: -118.4081,
		elevation: 125,
		timezone: 'America/Los_Angeles',
		type: 'large_airport'
	},
	{
		id: 'JFK',
		name: 'John F. Kennedy International Airport',
		city: 'New York',
		country: 'United States',
		iata: 'JFK',
		icao: 'KJFK',
		latitude: 40.6413,
		longitude: -73.7781,
		elevation: 13,
		timezone: 'America/New_York',
		type: 'large_airport'
	},
	{
		id: 'LHR',
		name: 'London Heathrow Airport',
		city: 'London',
		country: 'United Kingdom',
		iata: 'LHR',
		icao: 'EGLL',
		latitude: 51.4700,
		longitude: -0.4543,
		elevation: 25,
		timezone: 'Europe/London',
		type: 'large_airport'
	},
	{
		id: 'CDG',
		name: 'Charles de Gaulle Airport',
		city: 'Paris',
		country: 'France',
		iata: 'CDG',
		icao: 'LFPG',
		latitude: 49.0097,
		longitude: 2.5479,
		elevation: 119,
		timezone: 'Europe/Paris',
		type: 'large_airport'
	},
	{
		id: 'NRT',
		name: 'Narita International Airport',
		city: 'Tokyo',
		country: 'Japan',
		iata: 'NRT',
		icao: 'RJAA',
		latitude: 35.7720,
		longitude: 140.3929,
		elevation: 43,
		timezone: 'Asia/Tokyo',
		type: 'large_airport'
	},
	{
		id: 'SFO',
		name: 'San Francisco International Airport',
		city: 'San Francisco',
		country: 'United States',
		iata: 'SFO',
		icao: 'KSFO',
		latitude: 37.6213,
		longitude: -122.3790,
		elevation: 13,
		timezone: 'America/Los_Angeles',
		type: 'large_airport'
	},
	{
		id: 'ORD',
		name: "O'Hare International Airport",
		city: 'Chicago',
		country: 'United States',
		iata: 'ORD',
		icao: 'KORD',
		latitude: 41.9742,
		longitude: -87.9073,
		elevation: 201,
		timezone: 'America/Chicago',
		type: 'large_airport'
	},
	{
		id: 'DXB',
		name: 'Dubai International Airport',
		city: 'Dubai',
		country: 'United Arab Emirates',
		iata: 'DXB',
		icao: 'OMDB',
		latitude: 25.2532,
		longitude: 55.3657,
		elevation: 62,
		timezone: 'Asia/Dubai',
		type: 'large_airport'
	},
	{
		id: 'SIN',
		name: 'Singapore Changi Airport',
		city: 'Singapore',
		country: 'Singapore',
		iata: 'SIN',
		icao: 'WSSS',
		latitude: 1.3644,
		longitude: 103.9915,
		elevation: 22,
		timezone: 'Asia/Singapore',
		type: 'large_airport'
	},
	{
		id: 'HND',
		name: 'Tokyo Haneda Airport',
		city: 'Tokyo',
		country: 'Japan',
		iata: 'HND',
		icao: 'RJTT',
		latitude: 35.5494,
		longitude: 139.7798,
		elevation: 21,
		timezone: 'Asia/Tokyo',
		type: 'large_airport'
	},
	// Adding more airports for better global coverage
	{
		id: 'ATL',
		name: 'Hartsfield-Jackson Atlanta International Airport',
		city: 'Atlanta',
		country: 'United States',
		iata: 'ATL',
		icao: 'KATL',
		latitude: 33.6407,
		longitude: -84.4277,
		elevation: 313,
		timezone: 'America/New_York',
		type: 'large_airport'
	},
	{
		id: 'DEN',
		name: 'Denver International Airport',
		city: 'Denver',
		country: 'United States',
		iata: 'DEN',
		icao: 'KDEN',
		latitude: 39.8617,
		longitude: -104.6737,
		elevation: 1655,
		timezone: 'America/Denver',
		type: 'large_airport'
	},
	{
		id: 'MIA',
		name: 'Miami International Airport',
		city: 'Miami',
		country: 'United States',
		iata: 'MIA',
		icao: 'KMIA',
		latitude: 25.7959,
		longitude: -80.2870,
		elevation: 11,
		timezone: 'America/New_York',
		type: 'large_airport'
	},
	{
		id: 'SEA',
		name: 'Seattle-Tacoma International Airport',
		city: 'Seattle',
		country: 'United States',
		iata: 'SEA',
		icao: 'KSEA',
		latitude: 47.4502,
		longitude: -122.3088,
		elevation: 131,
		timezone: 'America/Los_Angeles',
		type: 'large_airport'
	},
	{
		id: 'BOS',
		name: 'Logan International Airport',
		city: 'Boston',
		country: 'United States',
		iata: 'BOS',
		icao: 'KBOS',
		latitude: 42.3656,
		longitude: -71.0096,
		elevation: 6,
		timezone: 'America/New_York',
		type: 'large_airport'
	},
	{
		id: 'YYZ',
		name: 'Toronto Pearson International Airport',
		city: 'Toronto',
		country: 'Canada',
		iata: 'YYZ',
		icao: 'CYYZ',
		latitude: 43.6777,
		longitude: -79.6248,
		elevation: 173,
		timezone: 'America/Toronto',
		type: 'large_airport'
	},
	{
		id: 'YVR',
		name: 'Vancouver International Airport',
		city: 'Vancouver',
		country: 'Canada',
		iata: 'YVR',
		icao: 'CYVR',
		latitude: 49.1939,
		longitude: -123.1844,
		elevation: 4,
		timezone: 'America/Vancouver',
		type: 'large_airport'
	},
	{
		id: 'FRA',
		name: 'Frankfurt Airport',
		city: 'Frankfurt',
		country: 'Germany',
		iata: 'FRA',
		icao: 'EDDF',
		latitude: 50.0379,
		longitude: 8.5622,
		elevation: 111,
		timezone: 'Europe/Berlin',
		type: 'large_airport'
	},
	{
		id: 'AMS',
		name: 'Amsterdam Airport Schiphol',
		city: 'Amsterdam',
		country: 'Netherlands',
		iata: 'AMS',
		icao: 'EHAM',
		latitude: 52.3105,
		longitude: 4.7683,
		elevation: -3,
		timezone: 'Europe/Amsterdam',
		type: 'large_airport'
	},
	{
		id: 'MAD',
		name: 'Adolfo Suárez Madrid–Barajas Airport',
		city: 'Madrid',
		country: 'Spain',
		iata: 'MAD',
		icao: 'LEMD',
		latitude: 40.4839,
		longitude: -3.5680,
		elevation: 610,
		timezone: 'Europe/Madrid',
		type: 'large_airport'
	},
	{
		id: 'FCO',
		name: 'Leonardo da Vinci International Airport',
		city: 'Rome',
		country: 'Italy',
		iata: 'FCO',
		icao: 'LIRF',
		latitude: 41.8003,
		longitude: 12.2389,
		elevation: 13,
		timezone: 'Europe/Rome',
		type: 'large_airport'
	},
	{
		id: 'IST',
		name: 'Istanbul Airport',
		city: 'Istanbul',
		country: 'Turkey',
		iata: 'IST',
		icao: 'LTFM',
		latitude: 41.2753,
		longitude: 28.7519,
		elevation: 325,
		timezone: 'Europe/Istanbul',
		type: 'large_airport'
	},
	{
		id: 'SYD',
		name: 'Sydney Kingsford Smith Airport',
		city: 'Sydney',
		country: 'Australia',
		iata: 'SYD',
		icao: 'YSSY',
		latitude: -33.9399,
		longitude: 151.1753,
		elevation: 21,
		timezone: 'Australia/Sydney',
		type: 'large_airport'
	},
	{
		id: 'MEL',
		name: 'Melbourne Airport',
		city: 'Melbourne',
		country: 'Australia',
		iata: 'MEL',
		icao: 'YMML',
		latitude: -37.6733,
		longitude: 144.8433,
		elevation: 132,
		timezone: 'Australia/Melbourne',
		type: 'large_airport'
	},
	{
		id: 'PEK',
		name: 'Beijing Capital International Airport',
		city: 'Beijing',
		country: 'China',
		iata: 'PEK',
		icao: 'ZBAA',
		latitude: 40.0799,
		longitude: 116.6031,
		elevation: 116,
		timezone: 'Asia/Shanghai',
		type: 'large_airport'
	},
	{
		id: 'ICN',
		name: 'Incheon International Airport',
		city: 'Seoul',
		country: 'South Korea',
		iata: 'ICN',
		icao: 'RKSI',
		latitude: 37.4602,
		longitude: 126.4407,
		elevation: 23,
		timezone: 'Asia/Seoul',
		type: 'large_airport'
	},
	{
		id: 'BKK',
		name: 'Suvarnabhumi Airport',
		city: 'Bangkok',
		country: 'Thailand',
		iata: 'BKK',
		icao: 'VTBS',
		latitude: 13.6900,
		longitude: 100.7501,
		elevation: 2,
		timezone: 'Asia/Bangkok',
		type: 'large_airport'
	},
	{
		id: 'DEL',
		name: 'Indira Gandhi International Airport',
		city: 'Delhi',
		country: 'India',
		iata: 'DEL',
		icao: 'VIDP',
		latitude: 28.5562,
		longitude: 77.1000,
		elevation: 237,
		timezone: 'Asia/Kolkata',
		type: 'large_airport'
	},
	{
		id: 'BOM',
		name: 'Chhatrapati Shivaji Maharaj International Airport',
		city: 'Mumbai',
		country: 'India',
		iata: 'BOM',
		icao: 'VABB',
		latitude: 19.0897,
		longitude: 72.8656,
		elevation: 11,
		timezone: 'Asia/Kolkata',
		type: 'large_airport'
	}
];

/**
 * Find airports near the given location using the API endpoint
 * @param lat User latitude
 * @param lng User longitude
 * @param maxResults Maximum number of results to return
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns Promise resolving to nearby airports with distances
 */
export async function findNearbyAirports(
	lat: number,
	lng: number,
	maxResults: number = 10,
	maxDistanceKm: number = 2000
): Promise<NearbyAirportsResult> {
	
	try {
		// Use the API endpoint to get real airport data
		const params = new URLSearchParams({
			lat: lat.toString(),
			lng: lng.toString(),
			maxResults: maxResults.toString(),
			maxDistanceKm: maxDistanceKm.toString()
		});
		
		const response = await fetch(`/api/airports?${params}`);
		
		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}
		
		const result = await response.json();
		return result;
		
	} catch (error) {
		console.error('Error fetching airports from API, falling back to hardcoded data:', error);
		
		// Fallback to hardcoded data if API fails
		const airportsWithDistance: Airport[] = AIRPORT_DATA
			.map(airport => ({
				...airport,
				distance: calculateDistance(lat, lng, airport.latitude, airport.longitude)
			}))
			.filter(airport => airport.distance! <= maxDistanceKm)
			.sort((a, b) => a.distance! - b.distance!)
			.slice(0, maxResults);

		return {
			airports: airportsWithDistance,
			userLocation: { lat, lng }
		};
	}
}

/**
 * Get airport by IATA code
 * @param iataCode 3-letter IATA code
 * @returns Airport or null if not found
 */
export async function getAirportByIATA(iataCode: string): Promise<Airport | null> {
	const airport = AIRPORT_DATA.find(a => a.iata === iataCode.toUpperCase());
	return airport || null;
}

/**
 * Search airports by name or city
 * @param query Search query
 * @param maxResults Maximum number of results
 * @returns Array of matching airports
 */
export async function searchAirports(query: string, maxResults: number = 10): Promise<Airport[]> {
	const searchTerm = query.toLowerCase();
	return AIRPORT_DATA
		.filter(airport => 
			airport.name.toLowerCase().includes(searchTerm) ||
			airport.city.toLowerCase().includes(searchTerm) ||
			airport.iata.toLowerCase().includes(searchTerm) ||
			airport.icao.toLowerCase().includes(searchTerm)
		)
		.slice(0, maxResults);
}

/**
 * In a real implementation, this would fetch from OurAirports API or dataset
 * URL: https://ourairports.com/data/
 * Dataset: https://datahub.io/core/airport-codes
 */
export async function loadAirportDatabase(): Promise<Airport[]> {
	// TODO: Implement actual data loading from OurAirports CSV
	// For now, return the sample data
	return AIRPORT_DATA as Airport[];
}