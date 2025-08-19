<script lang="ts">
	import LocationSelector from '$lib/components/LocationSelector.svelte';
	import AirportSelector from '$lib/components/AirportSelector.svelte';
	import FlightForm from '$lib/components/FlightForm.svelte';
	import TransportSelector from '$lib/components/TransportSelector.svelte';
	import DepartureResults from '$lib/components/DepartureResults.svelte';
	import StepSummary from '$lib/components/StepSummary.svelte';
	
	import type { Location } from '$lib/stores/location';
	import { locationStore } from '$lib/stores/location';
	import type { Airport, FlightInfo, TransportMode, RouteInfo } from '$lib/types/airport';
	import { findNearbyAirports } from '$lib/services/airports';
	import { calculateMultipleRoutes, formatDuration } from '$lib/services/routing';
	import { calculateDepartureTime } from '$lib/services/departure';
	import { geocodingService } from '$lib/services/geocoding';
	import { onMount } from 'svelte';

	// State
	let userLocation: Location | null = null;
	let userLocationAddress: string = '';
	let nearbyAirports: Airport[] = [];
	let selectedAirport: Airport | null = null;
	let flightInfo: FlightInfo | null = null;
	let availableRoutes: RouteInfo[] = [];
	let selectedRoute: RouteInfo | null = null;
	let departureCalculation: any = null;

	// Loading states
	let airportsLoading = false;
	let routesLoading = false;
	let airportsError: string | null = null;

	// Handle location update
	async function handleLocationUpdate(location: Location, selectedAddress?: string) {
		console.log('MAIN PAGE: handleLocationUpdate called with:', location, selectedAddress);
		// Only exit editing mode if we have a selectedAddress (user made a new selection)
		if (selectedAddress !== undefined) {
			editingLocation = false; // Reset editing mode
		}
		userLocation = location;
		console.log('MAIN PAGE: userLocation set to:', userLocation);
		
		// Use selected address or get human-readable address
		if (selectedAddress) {
			userLocationAddress = selectedAddress;
		} else {
			await updateLocationAddress(location);
		}
		
		await loadNearbyAirports();
		console.log('MAIN PAGE: loadNearbyAirports completed, nearbyAirports:', nearbyAirports);
	}

	// Update location address
	async function updateLocationAddress(location: Location) {
		try {
			const result = await geocodingService.reverseGeocode(location.lat, location.lng);
			if (result) {
				userLocationAddress = result.address 
					? geocodingService.formatAddress(result.address)
					: result.display_name;
			} else {
				userLocationAddress = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
			}
		} catch (error) {
			console.error('Failed to get location address:', error);
			userLocationAddress = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
		}
	}

	// Load nearby airports
	async function loadNearbyAirports() {
		console.log('loadNearbyAirports called with userLocation:', userLocation);
		if (!userLocation) {
			console.log('No userLocation, exiting');
			return;
		}
		
		console.log('Loading airports for:', userLocation.lat, userLocation.lng);
		airportsLoading = true;
		airportsError = null;
		
		try {
			const result = await findNearbyAirports(userLocation.lat, userLocation.lng);
			nearbyAirports = result.airports;
			console.log('Loaded', nearbyAirports.length, 'airports');
		} catch (error) {
			airportsError = 'Failed to load nearby airports';
			console.error('Error loading airports:', error);
		} finally {
			airportsLoading = false;
		}
	}

	// Handle airport selection
	async function handleAirportSelect(airport: Airport) {
		selectedAirport = airport;
		await calculateRoutes();
	}

	// Handle flight info change
	async function handleFlightInfoChange(info: FlightInfo) {
		flightInfo = { ...info, selectedAirport };
		updateDepartureCalculation();
	}

	// Calculate routes to selected airport
	async function calculateRoutes() {
		if (!userLocation || !selectedAirport) return;
		
		routesLoading = true;
		
		try {
			availableRoutes = await calculateMultipleRoutes(
				userLocation.lat,
				userLocation.lng,
				selectedAirport.latitude,
				selectedAirport.longitude
			);
			
			// Auto-select the fastest route (driving usually)
			if (availableRoutes.length > 0) {
				const fastestRoute = availableRoutes.reduce((fastest, current) => 
					current.duration < fastest.duration ? current : fastest
				);
				handleModeSelect(fastestRoute.mode, fastestRoute);
			}
		} catch (error) {
			console.error('Error calculating routes:', error);
		} finally {
			routesLoading = false;
		}
	}

	// Handle transport mode selection
	function handleModeSelect(mode: TransportMode, route: RouteInfo) {
		selectedRoute = route;
		updateDepartureCalculation();
	}

	// Update departure calculation
	function updateDepartureCalculation() {
		if (!flightInfo || !selectedRoute) {
			departureCalculation = null;
			return;
		}

		departureCalculation = calculateDepartureTime(flightInfo, selectedRoute);
	}

	// Wizard step management
	$: currentStep = getCurrentStep(userLocation, selectedAirport, flightInfo, selectedRoute);

	function getCurrentStep(userLoc: any, airport: any, flight: any, route: any): number {
		const step = !userLoc ? 1 : !airport ? 2 : (!flight || !flight.departureTime) ? 3 : !route ? 4 : 5;
		console.log('getCurrentStep:', { userLocation: userLoc, selectedAirport: airport, flightInfo: flight, selectedRoute: route, step });
		return step;
	}

	let editingLocation = false;

	function resetStep(step: number) {
		if (step === 1) {
			editingLocation = true;
			// Keep userLocation and userLocationAddress so map controls can be shown
			// Reset other steps
			nearbyAirports = [];
			selectedAirport = null;
			flightInfo = null;
			selectedRoute = null;
			departureCalculation = null;
			// Keep the current location in the store so LocationSelector shows map controls
			// locationStore.setLocation(null);
		} else if (step === 2) {
			selectedAirport = null;
			flightInfo = null;
			selectedRoute = null;
			departureCalculation = null;
		} else if (step === 3) {
			flightInfo = null;
			selectedRoute = null;
			departureCalculation = null;
		} else if (step === 4) {
			selectedRoute = null;
			departureCalculation = null;
		}
	}

	// Load airports when location is set
	onMount(() => {
		// Auto-load airports if we already have a location
		if (userLocation) {
			loadNearbyAirports();
		}
	});
</script>

<div class="airport-math">
	<header class="app-header">
		<h1>✈️ Airport Math</h1>
		<p>Plan your departure time with precision</p>
	</header>

	<main class="app-main">
		<!-- Step 1: Location -->
		{#if currentStep === 1 || editingLocation}
			<LocationSelector 
				onLocationUpdate={(loc, addr) => handleLocationUpdate(loc, addr)} 
				autoDetect={!editingLocation}
			/>
		{:else if userLocation}
			<StepSummary 
				title="Location" 
				summary="📍 {userLocationAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}"
				icon="✅"
				onEdit={() => resetStep(1)}
			/>
		{/if}

		<!-- Step 2: Airport Selection -->
		{#if currentStep === 2}
			<AirportSelector 
				airports={nearbyAirports}
				selectedAirport={selectedAirport}
				onAirportSelect={handleAirportSelect}
				loading={airportsLoading}
				error={airportsError}
			/>
		{:else if selectedAirport}
			<StepSummary 
				title="Airport" 
				summary="{selectedAirport.iata} - {selectedAirport.name}"
				icon="✅"
				onEdit={() => resetStep(2)}
			/>
		{/if}

		<!-- Step 3: Flight Information -->
		{#if currentStep === 3}
			<FlightForm 
				onFlightInfoChange={handleFlightInfoChange}
			/>
		{:else if flightInfo}
			<StepSummary 
				title="Flight" 
				summary="{flightInfo.departureTime} ({flightInfo.isInternational ? 'International' : 'Domestic'})"
				icon="✅"
				onEdit={() => resetStep(3)}
			/>
		{/if}

		<!-- Step 4: Transport Selection -->
		{#if currentStep === 4 && selectedAirport}
			<TransportSelector 
				routes={availableRoutes}
				onModeSelect={handleModeSelect}
				loading={routesLoading}
			/>
		{:else if selectedRoute}
			<StepSummary 
				title="Transport" 
				summary="{selectedRoute.mode.icon} {selectedRoute.mode.name} ({formatDuration(selectedRoute.duration)})"
				icon="✅"
				onEdit={() => resetStep(4)}
			/>
		{/if}

		<!-- Step 5: Results -->
		{#if currentStep === 5 && departureCalculation && selectedRoute}
			<DepartureResults 
				calculation={departureCalculation}
				route={selectedRoute}
			/>
		{/if}
	</main>

	<footer class="app-footer">
		<p>
			Built with open-source tools: 
			<a href="https://svelte.dev" target="_blank">Svelte</a>, 
			<a href="https://project-osrm.org/" target="_blank">OSRM</a>, 
			<a href="https://ourairports.com/data/" target="_blank">OurAirports</a>
		</p>
	</footer>
</div>

<style>
	.airport-math {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		text-align: center;
		margin-bottom: 24px;
		padding: 20px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.app-header h1 {
		margin: 0 0 8px 0;
		font-size: 2em;
		color: #007aff;
		font-weight: 700;
	}

	.app-header p {
		margin: 0;
		color: #666;
		font-size: 1.1em;
	}

	.app-main {
		flex: 1;
	}

	.app-footer {
		margin-top: 40px;
		padding: 20px;
		text-align: center;
		color: #666;
		font-size: 0.9em;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.app-footer p {
		margin: 0;
	}

	.app-footer a {
		color: #007aff;
		text-decoration: none;
	}

	.app-footer a:hover {
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.app-header h1 {
			font-size: 1.8em;
		}
		
		.app-header p {
			font-size: 1em;
		}
	}
</style>
