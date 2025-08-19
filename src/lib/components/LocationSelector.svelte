<script lang="ts">
	import { locationStore } from '$lib/stores/location';
	import { onMount, onDestroy } from 'svelte';
	import AddressSearch from './AddressSearch.svelte';
	import type { Location } from '$lib/stores/location';

	export let onLocationUpdate: ((location: Location, address?: string) => void) | undefined = undefined;
	export let autoDetect: boolean = true;

	let location: Location | null = null;
	let loading: boolean = false;
	let error: string | null = null;

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
			<p>Detecting your location...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-text">❌ {error}</p>
			<p class="help-text">Please search for your address above</p>
		</div>
	{:else if location}
		<div class="success-state">
			<p class="success-text">
				✅ Location detected
			</p>
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

	.help-text {
		color: #666;
		margin: 8px 0 0 0;
		font-size: 14px;
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
</style>