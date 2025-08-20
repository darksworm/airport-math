<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { isValidFlightTime } from '$lib/services/departure';

	export let flightTime: string = '';
	export let onFlightInfoChange: ((info: any) => void) | undefined = undefined;

	const dispatch = createEventDispatcher();

	let timeError = '';
	let dropdownOpen = false;
	let selectedHour = '12';
	let selectedMinute = '00';

	// Generate hour and minute options
	const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
	const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

	// Parse initial value - only update if different to avoid loops
	let lastParsedValue = '';
	$: {
		if (flightTime && flightTime.includes(':') && flightTime !== lastParsedValue) {
			const [h, m] = flightTime.split(':');
			selectedHour = h.padStart(2, '0');
			selectedMinute = m.padStart(2, '0');
			lastParsedValue = flightTime;
		}
	}

	// Update flightTime when selections change
	function updateFlightTime() {
		const newValue = `${selectedHour}:${selectedMinute}`;
		if (newValue !== flightTime) {
			flightTime = newValue;
			lastParsedValue = newValue;
			
			// Validate time
			if (flightTime && !isValidFlightTime(flightTime)) {
				timeError = 'Please enter a valid time';
			} else {
				timeError = '';
			}
		}
	}

	function openDropdown() {
		dropdownOpen = true;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	function selectHour(hour: string) {
		selectedHour = hour;
		updateFlightTime();
	}

	function selectMinute(minute: string) {
		selectedMinute = minute;
		updateFlightTime();
		// Auto-close after minute selection for better UX
		closeDropdown();
	}

	function handleConfirm() {
		if (flightTime && !timeError) {
			notifyChange();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleConfirm();
			closeDropdown();
		}
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}

	function notifyChange() {
		if (onFlightInfoChange && flightTime && !timeError) {
			onFlightInfoChange({
				departureTime: flightTime,
				selectedAirport: null // This will be set by parent
			});
		}
	}
</script>

<div class="flight-form" on:keydown={handleKeyDown}>
	<h2>✈️ Flight Departure Time</h2>
	
	<div class="time-input-container">
		<button 
			class="time-display-input" 
			class:open={dropdownOpen}
			class:error={!!timeError}
			on:click={openDropdown}
		>
			<span class="hour-display">{selectedHour}</span>
			<span class="time-separator">:</span>
			<span class="minute-display">{selectedMinute}</span>
		</button>
		
		{#if dropdownOpen}
			<div class="time-dropdown">
				<div class="time-columns">
					<div class="time-column">
						<h4>Hour</h4>
						<div class="options-list">
							{#each hours as hour}
								<button 
									class="time-option"
									class:selected={hour === selectedHour}
									on:click={() => selectHour(hour)}
								>
									{hour}
								</button>
							{/each}
						</div>
					</div>
					
					<div class="column-separator"></div>
					
					<div class="time-column">
						<h4>Minute</h4>
						<div class="options-list">
							{#each minutes as minute}
								<button 
									class="time-option"
									class:selected={minute === selectedMinute}
									on:click={() => selectMinute(minute)}
								>
									{minute}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if timeError}
		<div class="error-message">{timeError}</div>
	{/if}
	
	<div class="form-actions">
		<button 
			class="confirm-button" 
			on:click={handleConfirm}
			disabled={!flightTime || !!timeError}
		>
			✈️ Confirm Flight Details
		</button>
	</div>
</div>

<style>
	.flight-form {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	h2 {
		margin: 0 0 20px 0;
		font-size: 1.2em;
		color: #333;
	}

	.form-group {
		margin-bottom: 20px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		color: #333;
	}

	input[type="time"] {
		width: 100%;
		padding: 12px;
		border: 2px solid #e5e5e7;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s;
	}

	input[type="time"]:focus {
		outline: none;
		border-color: #007aff;
	}

	input[type="time"].error {
		border-color: #ff3b30;
	}

	.time-input-container {
		display: flex;
		justify-content: center;
		margin: 16px 0;
		position: relative;
	}

	.time-display-input {
		width: 100%;
		max-width: 200px;
		padding: 16px 20px;
		border: 2px solid #e5e5e7;
		border-radius: 8px;
		font-size: 1.4em;
		font-weight: 600;
		color: #007aff;
		background: #f8f9fa;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		transition: all 0.2s ease;
	}

	.time-display-input:hover {
		border-color: #007aff;
		background: #f0f8ff;
	}

	.time-display-input.open {
		border-color: #007aff;
		background: #f0f8ff;
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	.time-display-input.error {
		border-color: #ff3b30;
		background: rgba(255, 59, 48, 0.05);
	}

	.hour-display, .minute-display {
		min-width: 2ch;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.time-separator {
		margin: 0 4px;
		color: #007aff;
	}

	.time-dropdown {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		background: white;
		border: 2px solid #007aff;
		border-top: none;
		border-radius: 0 0 12px 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 100;
		min-width: 300px;
		max-height: 320px;
		overflow: hidden;
	}

	.time-columns {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		height: 100%;
	}

	.time-column {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.time-column h4 {
		margin: 0;
		padding: 12px;
		background: #f8f9fa;
		border-bottom: 1px solid #e5e5e7;
		font-size: 0.9em;
		color: #666;
		text-align: center;
		font-weight: 600;
	}

	.options-list {
		max-height: 240px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.time-option {
		border: none;
		background: none;
		padding: 10px 16px;
		cursor: pointer;
		font-size: 1em;
		color: #333;
		transition: background-color 0.2s;
		text-align: center;
		font-variant-numeric: tabular-nums;
		min-height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.time-option:hover {
		background: #f0f8ff;
	}

	.time-option.selected {
		background: #007aff;
		color: white;
		font-weight: 600;
	}

	.column-separator {
		width: 1px;
		background: #e5e5e7;
		margin: 12px 0;
	}

	.error-message {
		color: #ff3b30;
		font-size: 14px;
		margin-top: 8px;
		padding: 8px 12px;
		background: rgba(255, 59, 48, 0.1);
		border-radius: 6px;
		border-left: 3px solid #ff3b30;
	}

	.form-actions {
		margin-top: 20px;
		display: flex;
		justify-content: center;
	}
	
	.confirm-button {
		background: #007aff;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 200px;
	}
	
	.confirm-button:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
	}
	
	.confirm-button:disabled {
		background: #ccc;
		cursor: not-allowed;
		transform: none;
	}
</style>