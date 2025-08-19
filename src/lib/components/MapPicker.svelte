<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Location } from '$lib/stores/location';
	import { geocodingService } from '$lib/services/geocoding';

	export let location: Location | null = null;
	export let onLocationChange: ((location: Location) => void) | undefined = undefined;

	let mapContainer: HTMLDivElement;
	let map: any = null;
	let marker: any = null;
	let address: string = '';
	let loading: boolean = false;
	let L: any = null;

	onMount(async () => {
		if (!browser) return;

		// Import Leaflet CSS dynamically
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(link);

		// Wait for CSS to load
		await new Promise(resolve => {
			link.onload = resolve;
		});

		// Dynamically import Leaflet on the client side only
		const leaflet = await import('leaflet');
		L = leaflet;

		// Initialize map
		map = new L.Map(mapContainer, {
			center: location ? [location.lat, location.lng] : [51.505, -0.09],
			zoom: location ? 15 : 13
		});

		// Add OpenStreetMap tiles
		new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

		// Add marker if location exists
		if (location) {
			addMarker(location);
			updateAddress(location);
		}

		// Handle map clicks
		map.on('click', async (e: any) => {
			const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
			addMarker(newLocation);
			await updateAddress(newLocation);
			
			if (onLocationChange) {
				onLocationChange(newLocation);
			}
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	function addMarker(loc: Location) {
		if (!L || !map) return;
		
		if (marker) {
			marker.remove();
		}
		
		marker = new L.Marker([loc.lat, loc.lng]).addTo(map);
		map.setView([loc.lat, loc.lng], 15);
	}

	async function updateAddress(loc: Location) {
		loading = true;
		try {
			const result = await geocodingService.reverseGeocode(loc.lat, loc.lng);
			if (result) {
				address = result.address 
					? geocodingService.formatAddress(result.address)
					: result.display_name;
			} else {
				address = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
			}
		} catch (error) {
			console.error('Failed to get address:', error);
			address = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
		} finally {
			loading = false;
		}
	}

	$: if (location && map) {
		addMarker(location);
		updateAddress(location);
	}
</script>

<div class="map-picker">
	<div class="map-container" bind:this={mapContainer}></div>
	
	<div class="address-display">
		{#if loading}
			<div class="loading-spinner"></div>
			<span>Loading address...</span>
		{:else if address}
			<span class="address">{address}</span>
		{:else}
			<span class="placeholder">Click on the map to set location</span>
		{/if}
	</div>
</div>

<style>
	.map-picker {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.map-container {
		height: 300px;
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #ddd;
	}

	.address-display {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #f8f9fa;
		border-radius: 6px;
		min-height: 20px;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #f3f3f3;
		border-top: 2px solid #007aff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.address {
		color: #333;
		font-size: 14px;
	}

	.placeholder {
		color: #666;
		font-style: italic;
		font-size: 14px;
	}
</style>