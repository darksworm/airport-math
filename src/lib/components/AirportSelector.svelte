<script lang="ts">
	import type { Airport } from '$lib/types/airport';
	import { formatDistance } from '$lib/utils/distance';

	export let airports: Airport[] = [];
	export let selectedAirport: Airport | null = null;
	export let onAirportSelect: ((airport: Airport) => void) | undefined = undefined;
	export let loading: boolean = false;
	export let error: string | null = null;
	
	let showAllAirports = true;

	function handleAirportSelect(airport: Airport) {
		selectedAirport = airport;
		showAllAirports = false; // Collapse the list after selection
		if (onAirportSelect) {
			onAirportSelect(airport);
		}
	}

	function toggleAirportList() {
		showAllAirports = !showAllAirports;
	}

	// Reset view when airports change (new location)
	$: if (airports.length > 0 && !selectedAirport) {
		showAllAirports = true;
	}
</script>

<div class="airport-selector">
	<h2>✈️ Select Airport</h2>
	
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Finding nearby airports...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-text">❌ {error}</p>
		</div>
	{:else if airports.length === 0}
		<div class="empty-state">
			<p>📍 Enable location to find nearby airports</p>
		</div>
	{:else}
		<div class="airports-list">
			{#if selectedAirport && !showAllAirports}
				<!-- Show selected airport prominently -->
				<button 
					class="airport-card selected"
					on:click={() => selectedAirport && handleAirportSelect(selectedAirport)}
				>
					<div class="airport-main">
						<div class="airport-code">{selectedAirport.iata}</div>
						<div class="airport-info">
							<div class="airport-name">{selectedAirport.name}</div>
							<div class="airport-location">{selectedAirport.city}, {selectedAirport.country}</div>
						</div>
					</div>
					{#if selectedAirport.distance !== undefined}
						<div class="airport-distance">
							{formatDistance(selectedAirport.distance)}
						</div>
					{/if}
				</button>
				
				<!-- Show "Other airports..." button -->
				{#if airports.length > 1}
					<button class="other-airports-toggle" on:click={toggleAirportList}>
						<div class="toggle-content">
							<span class="toggle-text">Other airports...</span>
							<span class="toggle-count">({airports.length - 1} more)</span>
						</div>
						<div class="toggle-icon">▼</div>
					</button>
				{/if}
			{:else}
				<!-- Show all airports -->
				{#each airports as airport (airport.id)}
					<button 
						class="airport-card"
						class:selected={selectedAirport?.id === airport.id}
						on:click={() => handleAirportSelect(airport)}
					>
						<div class="airport-main">
							<div class="airport-code">{airport.iata}</div>
							<div class="airport-info">
								<div class="airport-name">{airport.name}</div>
								<div class="airport-location">{airport.city}, {airport.country}</div>
							</div>
						</div>
						{#if airport.distance !== undefined}
							<div class="airport-distance">
								{formatDistance(airport.distance)}
							</div>
						{/if}
					</button>
				{/each}
				
				<!-- Show "Collapse" button if an airport is selected -->
				{#if selectedAirport && airports.length > 1}
					<button class="collapse-toggle" on:click={toggleAirportList}>
						<div class="toggle-content">
							<span class="toggle-text">Show only selected airport</span>
						</div>
						<div class="toggle-icon">▲</div>
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.airport-selector {
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

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		align-items: center;
		gap: 12px;
		color: #666;
		justify-content: center;
		padding: 20px;
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

	.error-text {
		color: #ff3b30;
		margin: 0;
	}

	.airports-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: height 0.3s ease-in-out;
	}

	.airport-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border: 2px solid #e5e5e7;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.airport-card:hover {
		border-color: #007aff;
		box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.airport-card.selected {
		border-color: #007aff;
		background: #f0f8ff;
	}

	.airport-main {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
	}

	.airport-code {
		font-size: 1.5em;
		font-weight: bold;
		color: #007aff;
		min-width: 50px;
	}

	.airport-info {
		flex: 1;
	}

	.airport-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 4px;
	}

	.airport-location {
		font-size: 0.9em;
		color: #666;
	}

	.airport-distance {
		font-size: 0.9em;
		color: #007aff;
		font-weight: 600;
	}

	.other-airports-toggle,
	.collapse-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border: 2px dashed #ccc;
		border-radius: 8px;
		background: #f8f9fa;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
		margin-top: 8px;
		color: #666;
	}

	.other-airports-toggle:hover,
	.collapse-toggle:hover {
		border-color: #007aff;
		background: #f0f8ff;
		color: #007aff;
	}

	.toggle-content {
		flex: 1;
	}

	.toggle-text {
		font-size: 0.95em;
		font-weight: 500;
	}

	.toggle-count {
		font-size: 0.85em;
		color: #999;
		margin-left: 8px;
	}

	.toggle-icon {
		font-size: 0.8em;
		color: #999;
		margin-left: 12px;
		transition: all 0.2s ease;
	}

	.other-airports-toggle:hover .toggle-icon,
	.collapse-toggle:hover .toggle-icon {
		color: #007aff;
		transform: scale(1.1);
	}

	.collapse-toggle .toggle-icon {
		transform: rotate(180deg);
	}

	.collapse-toggle:hover .toggle-icon {
		transform: rotate(180deg) scale(1.1);
	}
</style>