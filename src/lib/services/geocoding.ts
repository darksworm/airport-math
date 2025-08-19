export interface Address {
	display_name: string;
	address?: {
		house_number?: string;
		road?: string;
		city?: string;
		town?: string;
		village?: string;
		state?: string;
		country?: string;
		postcode?: string;
	};
}

export interface GeocodingResult {
	lat: string;
	lon: string;
	display_name: string;
	address?: Address['address'];
}

class GeocodingService {
	private readonly baseUrl = 'https://nominatim.openstreetmap.org';

	async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
		try {
			const response = await fetch(
				`${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
				{
					headers: {
						'User-Agent': 'Airport-Math-App/1.0'
					}
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data as Address;
		} catch (error) {
			console.error('Reverse geocoding failed:', error);
			return null;
		}
	}

	async searchAddress(query: string): Promise<GeocodingResult[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
				{
					headers: {
						'User-Agent': 'Airport-Math-App/1.0'
					}
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data as GeocodingResult[];
		} catch (error) {
			console.error('Address search failed:', error);
			return [];
		}
	}

	formatAddress(address: Address['address']): string {
		if (!address) return '';

		const parts = [
			address.house_number,
			address.road,
			address.city || address.town || address.village,
			address.state,
			address.country
		].filter(Boolean);

		return parts.join(', ');
	}
}

export const geocodingService = new GeocodingService();