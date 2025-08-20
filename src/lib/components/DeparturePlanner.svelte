<script lang="ts">
	import type { DeparturePreferences, FlightInfo, RouteInfo } from '$lib/types/airport';
	
	export let flightInfo: FlightInfo;
	export let selectedRoute: RouteInfo;
	export let onPreferencesChange: ((preferences: DeparturePreferences) => void) | undefined = undefined;
	
	let preferences: DeparturePreferences = {
		hasCheckedBags: false,
		needsPassportControl: false,
		safetyMarginLevel: 3, // Moderate by default
		additionalBuffer: 0
	};
	
	const safetyLevels = [
		{ value: 1, label: "Aggressive", description: "Minimal buffers, tight timing" },
		{ value: 2, label: "Confident", description: "Some buffer, experienced traveler" },
		{ value: 3, label: "Moderate", description: "Balanced approach, reasonable buffers" },
		{ value: 4, label: "Conservative", description: "Extra time for unexpected delays" },
		{ value: 5, label: "Very Safe", description: "Maximum buffers, stress-free arrival" }
	];
	
	function updatePreferences() {
		if (onPreferencesChange) {
			onPreferencesChange(preferences);
		}
	}
	
	// Call updatePreferences whenever any preference changes
	$: if (preferences) {
		updatePreferences();
	}
	
	function handleSafetyLevelChange(event: Event) {
		const target = event.target as HTMLInputElement;
		preferences.safetyMarginLevel = parseInt(target.value);
		preferences = preferences; // Trigger reactivity
	}
	
	function handleAdditionalBufferChange(event: Event) {
		const target = event.target as HTMLInputElement;
		preferences.additionalBuffer = parseInt(target.value) || 0;
		preferences = preferences; // Trigger reactivity
	}
	
	$: currentSafetyLevel = safetyLevels.find(level => level.value === preferences.safetyMarginLevel) || safetyLevels[2];
</script>

<div class="departure-planner">
	<h2>🎯 Departure Planning</h2>
	<p class="subtitle">Let's customize your timing based on your travel preferences</p>
	
	<div class="planning-sections">
		<!-- Airport Processes -->
		<div class="section">
			<h3>Airport Processes</h3>
			
			<div class="option-group">
				<label class="checkbox-option">
					<input
						type="checkbox"
						bind:checked={preferences.hasCheckedBags}
					/>
					<span class="option-content">
						<strong>Check-in Baggage</strong>
						<small>Need to drop off checked bags at counter (+15-30 min)</small>
					</span>
				</label>
				
				<label class="checkbox-option">
					<input
						type="checkbox"
						bind:checked={preferences.needsPassportControl}
					/>
					<span class="option-content">
						<strong>Passport Control</strong>
						<small>International flight requiring passport check (+20-45 min)</small>
					</span>
				</label>
			</div>
		</div>
		
		<!-- Safety Margin -->
		<div class="section">
			<h3>Safety Margin Tolerance</h3>
			<p class="section-desc">How much buffer time do you prefer?</p>
			
			<div class="slider-container">
				<div class="slider-labels">
					<span class="label-left">Aggressive</span>
					<span class="label-right">Very Safe</span>
				</div>
				<input
					type="range"
					min="1"
					max="5"
					step="1"
					value={preferences.safetyMarginLevel}
					on:input={handleSafetyLevelChange}
					class="safety-slider"
				/>
				<div class="slider-value">
					<strong>{currentSafetyLevel.label}</strong>
					<small>{currentSafetyLevel.description}</small>
				</div>
			</div>
		</div>
		
		<!-- Additional Buffer -->
		<div class="section">
			<h3>Personal Buffer</h3>
			<p class="section-desc">Extra time you'd like to add (optional)</p>
			
			<div class="input-group">
				<input
					type="number"
					min="0"
					max="120"
					step="5"
					value={preferences.additionalBuffer}
					on:input={handleAdditionalBufferChange}
					class="buffer-input"
				/>
				<span class="input-suffix">minutes</span>
			</div>
		</div>
	</div>
	
	<div class="flight-info">
		<div class="info-item">
			<span class="info-label">Flight Time:</span>
			<span class="info-value">{flightInfo.departureTime}</span>
		</div>
		<div class="info-item">
			<span class="info-label">Transport:</span>
			<span class="info-value">{selectedRoute.mode.icon} {selectedRoute.mode.name}</span>
		</div>
	</div>
</div>

<style>
	.departure-planner {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	h2 {
		margin: 0 0 8px 0;
		font-size: 1.3em;
		color: #333;
	}
	
	.subtitle {
		margin: 0 0 24px 0;
		color: #666;
		font-size: 0.95em;
	}

	.planning-sections {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.section {
		border: 1px solid #e5e5e7;
		border-radius: 8px;
		padding: 20px;
		background: #fafbfc;
	}

	.section h3 {
		margin: 0 0 12px 0;
		font-size: 1.1em;
		color: #333;
	}
	
	.section-desc {
		margin: 0 0 16px 0;
		color: #666;
		font-size: 0.9em;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.checkbox-option {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		cursor: pointer;
		padding: 12px;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.checkbox-option:hover {
		background: rgba(0, 122, 255, 0.05);
	}

	.checkbox-option input[type="checkbox"] {
		margin: 2px 0 0 0;
		width: 18px;
		height: 18px;
		accent-color: #007aff;
		flex-shrink: 0;
	}

	.option-content {
		flex: 1;
	}

	.option-content strong {
		display: block;
		color: #333;
		margin-bottom: 4px;
	}

	.option-content small {
		color: #666;
		font-size: 0.85em;
		line-height: 1.3;
	}

	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.85em;
		color: #666;
		margin-bottom: 4px;
	}

	.safety-slider {
		width: 100%;
		height: 6px;
		background: #e5e5e7;
		border-radius: 3px;
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.safety-slider::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		background: #007aff;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.safety-slider::-webkit-slider-thumb:hover {
		background: #0056b3;
	}

	.safety-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #007aff;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.slider-value {
		text-align: center;
		margin-top: 8px;
	}

	.slider-value strong {
		display: block;
		color: #007aff;
		font-size: 1em;
	}

	.slider-value small {
		color: #666;
		font-size: 0.85em;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.buffer-input {
		width: 80px;
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 16px;
		text-align: center;
	}

	.buffer-input:focus {
		outline: none;
		border-color: #007aff;
		box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
	}

	.input-suffix {
		color: #666;
		font-size: 0.9em;
	}

	.flight-info {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid #eee;
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-label {
		font-size: 0.85em;
		color: #666;
	}

	.info-value {
		font-weight: 600;
		color: #333;
	}

	@media (max-width: 640px) {
		.departure-planner {
			padding: 16px;
		}
		
		.flight-info {
			flex-direction: column;
			gap: 12px;
		}
	}
</style>