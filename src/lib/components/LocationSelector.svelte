<script lang="ts">
	import { locationStore } from '$lib/stores/location';
	import { onMount, onDestroy } from 'svelte';
	import MapPicker from './MapPicker.svelte';
	import AddressSearch from './AddressSearch.svelte';
	import type { Location } from '$lib/stores/location';

	export let onLocationUpdate: ((location: Location, address?: string) => void) | undefined = undefined;
	export let autoDetect: boolean = true;

	let location: Location | null = null;
	let loading: boolean = false;
	let error: string | null = null;
	let showMap: boolean = false;

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		console.log('LocationSelector: onMount called, onLocationUpdate is:', !!onLocationUpdate);
		
		// Subscribe to store changes
		unsubscribe = locationStore.subscribe((storeValue) => {
			console.log('LocationSelector: Store subscription update:', storeValue);
			
			// Update local state
			location = storeValue.location;
			loading = storeValue.loading;
			error = storeValue.error;
			
			// Call parent whenever we have a location (but not during manual selection)
			if (storeValue.location && onLocationUpdate && !isManualSelection) {
				console.log('LocationSelector: Location available, calling onLocationUpdate with', storeValue.location);
				onLocationUpdate(storeValue.location);
			}
		});

		// Auto-detect location on mount (if enabled)
		if (autoDetect) {
			console.log('LocationSelector: Calling getCurrentLocation');
			locationStore.getCurrentLocation();
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	function handleRetry() {
		locationStore.clearError();
		locationStore.getCurrentLocation();
	}

	let isManualSelection = false;
	
	function handleManualLocation(newLocation: Location, selectedAddress?: string) {
		// Set flag to prevent store subscription from calling parent
		isManualSelection = true;
		
		// Update the store with the manually selected location
		locationStore.setLocation(newLocation);
		
		if (onLocationUpdate) {
			onLocationUpdate(newLocation, selectedAddress);
		}
		
		// Reset flag after a brief delay
		setTimeout(() => {
			isManualSelection = false;
		}, 100);
	}

	function toggleMap() {
		showMap = !showMap;
	}
</script>

<div class="location-selector">
	<h2>📍 Your Location</h2>
	
	<!-- Address Search -->
	<div class="search-section">
		<AddressSearch onLocationSelect={(loc, addr) => handleManualLocation(loc, addr)} />
	</div>
	
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Getting your location...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-text">❌ {error}</p>
			<button class="retry-button" on:click={handleRetry}>
				Try Again
			</button>
		</div>
	{:else if location}
		<div class="success-state">
			<p class="success-text">
				✅ Located: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
			</p>
		</div>
	{/if}

	<!-- Show location controls whenever we have a location -->
	{#if location}
		<div class="action-buttons">
			<button class="update-button" on:click={() => locationStore.getCurrentLocation()}>
				📍 Use GPS
			</button>
			<button class="map-button" on:click={toggleMap}>
				🗺️ {showMap ? 'Hide Map' : 'Show Map'}
			</button>
		</div>
	{/if}

	<!-- Map Section -->
	{#if showMap && location}
		<div class="map-section">
			<MapPicker 
				{location} 
				onLocationChange={(loc) => handleManualLocation(loc)} 
			/>
		</div>
	{/if}
</div>

<style>
	.location-selector {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	h2 {
		margin: 0 0 16px 0;
		font-size: 1.2em;
		color: #333;
	}

	.loading-state {
		display: flex;
		align-items: center;
		gap: 12px;
		color: #666;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #f3f3f3;
		border-top: 2px solid #007aff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-state {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.error-text {
		color: #ff3b30;
		margin: 0;
	}

	.search-section {
		margin-bottom: 16px;
	}

	.success-state {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.success-text {
		color: #34c759;
		margin: 0;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	button {
		background: #007aff;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background: #0056b3;
	}

	.retry-button {
		background: #ff3b30;
		align-self: flex-start;
	}

	.retry-button:hover {
		background: #d70015;
	}

	.update-button {
		background: #34c759;
		font-size: 12px;
		padding: 6px 12px;
		flex: 1;
		min-width: 100px;
	}

	.update-button:hover {
		background: #248a3d;
	}

	.map-button {
		background: #007aff;
		font-size: 12px;
		padding: 6px 12px;
		flex: 1;
		min-width: 100px;
	}

	.map-button:hover {
		background: #0056b3;
	}

	.map-section {
		margin-top: 16px;
		border-top: 1px solid #eee;
		padding-top: 16px;
	}
</style>