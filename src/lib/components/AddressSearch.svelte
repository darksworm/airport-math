<script lang="ts">
	import { geocodingService, type GeocodingResult } from '$lib/services/geocoding';
	import type { Location } from '$lib/stores/location';

	export let onLocationSelect: ((location: Location, address?: string) => void) | undefined = undefined;

	let searchQuery = '';
	let searchResults: GeocodingResult[] = [];
	let loading = false;
	let showResults = false;
	let searchTimeout: number | null = null;

	async function handleSearch() {
		if (!searchQuery.trim() || searchQuery.length < 3) {
			searchResults = [];
			showResults = false;
			return;
		}

		loading = true;
		try {
			const results = await geocodingService.searchAddress(searchQuery);
			searchResults = results;
			showResults = results.length > 0;
		} catch (error) {
			console.error('Search failed:', error);
			searchResults = [];
			showResults = false;
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		searchTimeout = window.setTimeout(handleSearch, 300);
	}

	function selectResult(result: GeocodingResult) {
		const location: Location = {
			lat: parseFloat(result.lat),
			lng: parseFloat(result.lon)
		};

		const selectedAddress = result.display_name;
		searchQuery = selectedAddress;
		showResults = false;
		
		if (onLocationSelect) {
			onLocationSelect(location, selectedAddress);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showResults = false;
		}
	}

	function handleClickOutside() {
		showResults = false;
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="address-search" on:click|stopPropagation on:keydown role="search">
	<div class="search-input-container">
		<input
			type="text"
			placeholder="Search for an address..."
			bind:value={searchQuery}
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:focus={() => searchQuery.length >= 3 && searchResults.length > 0 && (showResults = true)}
		/>
		
		{#if loading}
			<div class="search-spinner"></div>
		{/if}
	</div>

	{#if showResults && searchResults.length > 0}
		<div class="search-results">
			{#each searchResults as result}
				<button
					class="search-result"
					on:click={() => selectResult(result)}
					type="button"
				>
					<div class="result-name">{result.display_name}</div>
					{#if result.address}
						<div class="result-details">
							{geocodingService.formatAddress(result.address)}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.address-search {
		position: relative;
		width: 100%;
	}

	.search-input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #007aff;
		box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
	}

	.search-spinner {
		position: absolute;
		right: 12px;
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

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-top: none;
		border-radius: 0 0 8px 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	}

	.search-result {
		display: block;
		width: 100%;
		text-align: left;
		padding: 12px 16px;
		border: none;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s;
		border-bottom: 1px solid #eee;
	}

	.search-result:last-child {
		border-bottom: none;
	}

	.search-result:hover {
		background-color: #f8f9fa;
	}

	.result-name {
		font-weight: 500;
		color: #333;
		margin-bottom: 4px;
	}

	.result-details {
		font-size: 14px;
		color: #666;
	}
</style>