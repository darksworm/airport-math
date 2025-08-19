import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Location {
	lat: number;
	lng: number;
}

export interface LocationState {
	location: Location | null;
	loading: boolean;
	error: string | null;
}

function createLocationStore() {
	const { subscribe, set, update } = writable<LocationState>({
		location: null,
		loading: false,
		error: null
	});

	async function getCurrentLocation(): Promise<void> {
		console.log('LocationStore: getCurrentLocation called, browser:', browser, 'geolocation:', !!navigator.geolocation);
		
		if (!browser || !navigator.geolocation) {
			console.log('LocationStore: Geolocation not supported');
			update(state => ({
				...state,
				error: 'Geolocation not supported in this browser',
				loading: false
			}));
			return;
		}

		console.log('LocationStore: Setting loading to true');
		update(state => ({ ...state, loading: true, error: null }));

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(
					resolve,
					reject,
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 300000 // 5 minutes
					}
				);
			});

			const location: Location = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			console.log('LocationStore: Got location:', location);

			update(state => ({
				...state,
				location,
				loading: false,
				error: null
			}));
		} catch (err) {
			const error = err instanceof GeolocationPositionError 
				? getGeolocationErrorMessage(err.code)
				: 'Failed to get location';
			
			update(state => ({
				...state,
				loading: false,
				error
			}));
		}
	}

	function getGeolocationErrorMessage(code: number): string {
		switch (code) {
			case GeolocationPositionError.PERMISSION_DENIED:
				return 'Location access denied. Please enable location permissions.';
			case GeolocationPositionError.POSITION_UNAVAILABLE:
				return 'Location information unavailable.';
			case GeolocationPositionError.TIMEOUT:
				return 'Location request timeout.';
			default:
				return 'Unknown location error.';
		}
	}

	function clearError(): void {
		update(state => ({ ...state, error: null }));
	}

	return {
		subscribe,
		getCurrentLocation,
		clearError
	};
}

export const locationStore = createLocationStore();