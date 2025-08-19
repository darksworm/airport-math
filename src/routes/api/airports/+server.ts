import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateDistance } from '$lib/utils/distance';

// Define the airport interface for API responses
interface ApiAirport {
	id: string;
	name: string;
	city: string;
	country: string;
	iata: string;
	icao: string;
	latitude: number;
	longitude: number;
	elevation: number;
	timezone?: string;
	type: string;
}

// Cache for airport data to avoid repeated API calls
let airportCache: ApiAirport[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch airports from OurAirports CSV data
 * Alternative: Could use https://raw.githubusercontent.com/hroptatyr/airports/master/airports.csv
 */
async function fetchAirportsFromAPI(): Promise<ApiAirport[]> {
	try {
		// Use the OurAirports CSV data (public domain)
		const response = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const csvText = await response.text();
		const lines = csvText.split('\n');
		const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
		
		const airports: ApiAirport[] = [];
		
		// Parse CSV and filter for commercial passenger airports only
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;
			
			// Simple CSV parsing (note: this is basic and may need enhancement for complex CSV)
			const values = line.split(',').map(v => v.replace(/"/g, ''));
			
			if (values.length < headers.length) continue;
			
			const airport: any = {};
			headers.forEach((header, index) => {
				airport[header] = values[index];
			});
			
			// Filter for commercial passenger airports only
			if (
				// Must be large or medium commercial airports
				(airport.type === 'large_airport' || airport.type === 'medium_airport') &&
				
				// Must have valid coordinates
				airport.latitude_deg && 
				airport.longitude_deg &&
				
				// Must have IATA code (commercial passenger airports typically have these)
				airport.iata_code &&
				airport.iata_code.length === 3 &&
				
				// Exclude military, private, and other non-passenger airports
				!airport.name?.toLowerCase().includes('military') &&
				!airport.name?.toLowerCase().includes('air force') &&
				!airport.name?.toLowerCase().includes('army') &&
				!airport.name?.toLowerCase().includes('navy') &&
				!airport.name?.toLowerCase().includes('private') &&
				!airport.name?.toLowerCase().includes('heliport') &&
				
				// Exclude closed airports
				airport.scheduled_service === 'yes' &&
				
				// Must have a proper name and city
				airport.name && 
				airport.municipality &&
				
				// Exclude seaplane bases and other specialized airports
				airport.type !== 'seaplane_base' &&
				airport.type !== 'heliport' &&
				airport.type !== 'balloonport'
			) {
				airports.push({
					id: airport.ident || airport.iata_code,
					name: airport.name || 'Unknown Airport',
					city: airport.municipality || 'Unknown City',
					country: airport.iso_country || 'Unknown Country',
					iata: airport.iata_code,
					icao: airport.ident || airport.gps_code || '',
					latitude: parseFloat(airport.latitude_deg),
					longitude: parseFloat(airport.longitude_deg),
					elevation: parseInt(airport.elevation_ft) || 0,
					timezone: airport.timezone || 'UTC',
					type: airport.type
				});
			}
		}
		
		console.log(`Loaded ${airports.length} commercial passenger airports from OurAirports`);
		console.log('Filtered out: military, private, heliports, seaplane bases, closed airports');
		return airports;
		
	} catch (error) {
		console.error('Error fetching airports from API:', error);
		
		// Fallback to a curated list of major commercial passenger airports
		return [
			{
				id: 'LAX',
				name: 'Los Angeles International Airport',
				city: 'Los Angeles',
				country: 'US',
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
				country: 'US',
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
				country: 'GB',
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
				country: 'FR',
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
				country: 'JP',
				iata: 'NRT',
				icao: 'RJAA',
				latitude: 35.7720,
				longitude: 140.3929,
				elevation: 43,
				timezone: 'Asia/Tokyo',
				type: 'large_airport'
			},
			{
				id: 'ATL',
				name: 'Hartsfield-Jackson Atlanta International Airport',
				city: 'Atlanta',
				country: 'US',
				iata: 'ATL',
				icao: 'KATL',
				latitude: 33.6407,
				longitude: -84.4277,
				elevation: 313,
				timezone: 'America/New_York',
				type: 'large_airport'
			},
			{
				id: 'DXB',
				name: 'Dubai International Airport',
				city: 'Dubai',
				country: 'AE',
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
				country: 'SG',
				iata: 'SIN',
				icao: 'WSSS',
				latitude: 1.3644,
				longitude: 103.9915,
				elevation: 22,
				timezone: 'Asia/Singapore',
				type: 'large_airport'
			},
			{
				id: 'FRA',
				name: 'Frankfurt Airport',
				city: 'Frankfurt',
				country: 'DE',
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
				country: 'NL',
				iata: 'AMS',
				icao: 'EHAM',
				latitude: 52.3105,
				longitude: 4.7683,
				elevation: -3,
				timezone: 'Europe/Amsterdam',
				type: 'large_airport'
			}
		];
	}
}

/**
 * Get cached airport data or fetch fresh data
 */
async function getAirports(): Promise<ApiAirport[]> {
	const now = Date.now();
	
	if (airportCache && now < cacheExpiry) {
		return airportCache;
	}
	
	airportCache = await fetchAirportsFromAPI();
	cacheExpiry = now + CACHE_DURATION;
	
	return airportCache;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const lat = parseFloat(url.searchParams.get('lat') || '0');
		const lng = parseFloat(url.searchParams.get('lng') || '0');
		const maxResults = parseInt(url.searchParams.get('maxResults') || '10');
		const maxDistanceKm = parseInt(url.searchParams.get('maxDistanceKm') || '2000');
		
		if (!lat || !lng) {
			return json({ error: 'Latitude and longitude are required' }, { status: 400 });
		}
		
		console.log('API: Finding airports near', { lat, lng, maxResults, maxDistanceKm });
		
		const airports = await getAirports();
		
		// Calculate distances and filter
		const airportsWithDistance = airports
			.map(airport => ({
				...airport,
				distance: calculateDistance(lat, lng, airport.latitude, airport.longitude)
			}))
			.filter(airport => airport.distance <= maxDistanceKm)
			.sort((a, b) => a.distance - b.distance)
			.slice(0, maxResults);
		
		console.log(`API: Found ${airportsWithDistance.length} airports within ${maxDistanceKm}km`);
		
		return json({
			airports: airportsWithDistance,
			userLocation: { lat, lng }
		});
		
	} catch (error) {
		console.error('Error in airports API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};