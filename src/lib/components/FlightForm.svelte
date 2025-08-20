<script lang="ts">
	import { isValidFlightTime } from '$lib/services/departure';
	import ModernTimeInput from './ModernTimeInput.svelte';

	export let flightTime: string = '';
	export let onFlightInfoChange: ((info: any) => void) | undefined = undefined;

	let timeError = '';
	let notifyTimeout: number | null = null;

	function handleTimeChange(event: CustomEvent) {
		flightTime = event.detail;
		
		// Validate time
		if (flightTime && !isValidFlightTime(flightTime)) {
			timeError = 'Please enter a valid time';
		} else {
			timeError = '';
		}
		
		// Don't auto-notify - wait for explicit confirmation
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

<div class="flight-form">
	<h2>🛫 Flight Information</h2>
	
	<ModernTimeInput 
		value={flightTime}
		error={timeError}
		on:change={handleTimeChange}
		on:submit={handleConfirm}
	/>

	
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

	.error-message {
		color: #ff3b30;
		font-size: 14px;
		margin-top: 4px;
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