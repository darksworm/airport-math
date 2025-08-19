<script lang="ts">
	import { isValidFlightTime } from '$lib/services/departure';

	export let flightTime: string = '';
	export let isInternational: boolean = false;
	export let onFlightInfoChange: ((info: any) => void) | undefined = undefined;

	let timeError = '';
	let notifyTimeout: number | null = null;

	function handleTimeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		flightTime = target.value;
		
		// Validate time
		if (flightTime && !isValidFlightTime(flightTime)) {
			timeError = 'Please enter a valid time';
		} else {
			timeError = '';
		}
		
		// Don't auto-notify - wait for explicit confirmation
	}

	function handleInternationalChange(event: Event) {
		const target = event.target as HTMLInputElement;
		isInternational = target.checked;
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
				isInternational,
				selectedAirport: null // This will be set by parent
			});
		}
	}
</script>

<div class="flight-form">
	<h2>🛫 Flight Information</h2>
	
	<div class="form-group">
		<label for="flight-time">Departure Time</label>
		<input
			id="flight-time"
			type="time"
			bind:value={flightTime}
			on:input={handleTimeChange}
			on:keydown={handleKeyDown}
			class:error={timeError}
		/>
		{#if timeError}
			<div class="error-message">{timeError}</div>
		{/if}
	</div>

	<div class="form-group checkbox-group">
		<label class="checkbox-label">
			<input
				type="checkbox"
				bind:checked={isInternational}
				on:change={handleInternationalChange}
			/>
			<span class="checkbox-text">
				International Flight
				<small>International flights require 3h check-in, domestic flights 2h</small>
			</span>
		</label>
	</div>

	<div class="info-box">
		<div class="info-item">
			<span class="info-label">Check-in Buffer:</span>
			<span class="info-value">
				{isInternational ? '3 hours' : '2 hours'}
			</span>
		</div>
		<div class="info-item">
			<span class="info-label">Flight Type:</span>
			<span class="info-value">
				{isInternational ? 'International' : 'Domestic'}
			</span>
		</div>
	</div>
	
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

	.checkbox-group {
		margin-bottom: 16px;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		cursor: pointer;
		font-weight: normal;
		margin-bottom: 0;
	}

	input[type="checkbox"] {
		margin: 0;
		width: 18px;
		height: 18px;
		accent-color: #007aff;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.checkbox-text {
		flex: 1;
	}

	.checkbox-text small {
		display: block;
		color: #666;
		font-size: 0.85em;
		margin-top: 4px;
	}

	.info-box {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
		border-left: 4px solid #007aff;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	.info-label {
		color: #666;
		font-size: 0.9em;
	}

	.info-value {
		font-weight: 600;
		color: #333;
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