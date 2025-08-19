<script lang="ts">
	import type { TransportMode, RouteInfo } from '$lib/types/airport';
	import { TRANSPORT_MODES, formatDuration, formatDistance } from '$lib/services/routing';

	export let routes: RouteInfo[] = [];
	export let selectedMode: TransportMode | null = null;
	export let onModeSelect: ((mode: TransportMode, route: RouteInfo) => void) | undefined = undefined;
	export let loading: boolean = false;

	function handleModeSelect(mode: TransportMode, route: RouteInfo) {
		selectedMode = mode;
		if (onModeSelect) {
			onModeSelect(mode, route);
		}
	}

	// Find route for each transport mode
	function getRouteForMode(mode: TransportMode): RouteInfo | undefined {
		return routes.find(route => route.mode.id === mode.id);
	}
</script>

<div class="transport-selector">
	<h2>🚗 Transport Options</h2>
	
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Calculating routes...</p>
		</div>
	{:else if routes.length === 0}
		<div class="empty-state">
			<p>📍 Select an airport to see transport options</p>
		</div>
	{:else}
		<div class="transport-modes">
			{#each TRANSPORT_MODES as mode (mode.id)}
				{@const route = getRouteForMode(mode)}
				{#if route}
					<button 
						class="transport-card"
						class:selected={selectedMode?.id === mode.id}
						on:click={() => handleModeSelect(mode, route)}
					>
						<div class="transport-icon">{mode.icon}</div>
						<div class="transport-info">
							<div class="transport-name">{mode.name}</div>
							<div class="transport-details">
								<span class="duration">{formatDuration(route.duration)}</span>
								<span class="distance">{formatDistance(route.distance)}</span>
							</div>
							<div class="transport-description">{mode.description}</div>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
	
	{#if selectedMode && routes.length > 0}
		{@const selectedRoute = getRouteForMode(selectedMode)}
		{#if selectedRoute}
			<div class="route-details">
				<h3>📍 Route Details</h3>
				<div class="route-info">
					<div class="route-stat">
						<span class="stat-label">Duration:</span>
						<span class="stat-value">{formatDuration(selectedRoute.duration)}</span>
					</div>
					<div class="route-stat">
						<span class="stat-label">Distance:</span>
						<span class="stat-value">{formatDistance(selectedRoute.distance)}</span>
					</div>
					<div class="route-stat">
						<span class="stat-label">Mode:</span>
						<span class="stat-value">{selectedRoute.mode.icon} {selectedRoute.mode.name}</span>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.transport-selector {
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

	h3 {
		margin: 0 0 12px 0;
		font-size: 1.1em;
		color: #333;
	}

	.loading-state,
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

	.transport-modes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 12px;
		margin-bottom: 20px;
	}

	.transport-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		border: 2px solid #e5e5e7;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.transport-card:hover {
		border-color: #007aff;
		box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.transport-card.selected {
		border-color: #007aff;
		background: #f0f8ff;
	}

	.transport-icon {
		font-size: 2em;
		flex-shrink: 0;
	}

	.transport-info {
		flex: 1;
	}

	.transport-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 4px;
	}

	.transport-details {
		display: flex;
		gap: 12px;
		margin-bottom: 4px;
	}

	.duration {
		color: #007aff;
		font-weight: 600;
	}

	.distance {
		color: #666;
		font-size: 0.9em;
	}

	.transport-description {
		font-size: 0.85em;
		color: #666;
	}

	.route-details {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
		border-left: 4px solid #007aff;
	}

	.route-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.route-stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-label {
		color: #666;
		font-size: 0.9em;
	}

	.stat-value {
		font-weight: 600;
		color: #333;
	}

	@media (max-width: 640px) {
		.transport-modes {
			grid-template-columns: 1fr;
		}
		
		.route-info {
			gap: 12px;
		}
	}
</style>