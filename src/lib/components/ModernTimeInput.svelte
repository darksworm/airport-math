<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let value: string = '';
	export let error: string = '';
	
	const dispatch = createEventDispatcher();
	
	let hours: string = '';
	let minutes: string = '';
	let hourInput: HTMLInputElement;
	let minuteInput: HTMLInputElement;
	
	// Debug: log the locale for troubleshooting
	console.log('Browser locale:', navigator.language || navigator.languages?.[0] || 'unknown');
	
	// Parse initial value
	$: if (value && value !== formatTime()) {
		parseTimeValue(value);
	}
	
	function parseTimeValue(timeStr: string) {
		if (!timeStr || !timeStr.includes(':')) return;
		
		const [h, m] = timeStr.split(':');
		const hourNum = parseInt(h);
		
		// Always use 24-hour format now
		hours = hourNum.toString();
		minutes = m;
	}
	
	function formatTime(): string {
		if (!hours || !minutes) return '';
		
		const h = parseInt(hours);
		// Always 24-hour format now
		return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
	}
	
	function handleTimeChange() {
		const newValue = formatTime();
		if (newValue && newValue !== value) {
			dispatch('change', newValue);
		}
	}
	
	function handleHourChange(event: Event) {
		const target = event.target as HTMLInputElement;
		let val = target.value.replace(/\D/g, '');
		if (val.length > 2) val = val.slice(-2);
		
		// 24-hour validation: 0-23
		if (parseInt(val) > 23) val = '23';
		if (parseInt(val) < 0 && val.length === 2) val = '0';
		
		hours = val;
		
		// Auto-advance to minutes when hour is complete
		if (val.length === 2 || (val.length === 1 && parseInt(val) > 2)) {
			setTimeout(() => {
				minuteInput?.focus();
			}, 10);
		}
		
		handleTimeChange();
	}
	
	function handleMinuteChange(event: Event) {
		const target = event.target as HTMLInputElement;
		let val = target.value.replace(/\D/g, '');
		if (val.length > 2) val = val.slice(-2);
		if (parseInt(val) > 59) val = '59';
		minutes = val;
		handleTimeChange();
	}
	
	function handleKeyDown(event: KeyboardEvent, field: 'hour' | 'minute') {
		const target = event.target as HTMLInputElement;
		
		// Handle backspace when field is empty - go to previous field
		if (event.key === 'Backspace' && target.value === '' && field === 'minute') {
			event.preventDefault();
			hourInput?.focus();
			// Put cursor at end of hour field
			setTimeout(() => {
				if (hourInput) {
					hourInput.setSelectionRange(hourInput.value.length, hourInput.value.length);
				}
			}, 10);
		}
		
		// Handle tab/enter to advance to next field
		if (event.key === 'Tab' || event.key === 'Enter') {
			if (field === 'hour' && target.value.length > 0) {
				event.preventDefault();
				minuteInput?.focus();
			}
		}
	}
	
	
</script>

<div class="modern-time-input">
	<label class="time-label">
		✈️ Flight Departure Time
		<span class="label-hint">When does your flight leave?</span>
	</label>
	
	<!-- Custom Time Picker -->
	<div class="time-picker">
		<div class="time-display">
			<div class="time-field">
				<input
					type="text"
					bind:value={hours}
					bind:this={hourInput}
					on:input={handleHourChange}
					on:keydown={(e) => handleKeyDown(e, 'hour')}
					placeholder="16"
					class="time-input hour-input"
					maxlength="2"
					autofocus
				/>
				<span class="field-label">Hour</span>
			</div>
			
			<div class="time-separator">:</div>
			
			<div class="time-field">
				<input
					type="text"
					bind:value={minutes}
					bind:this={minuteInput}
					on:input={handleMinuteChange}
					on:keydown={(e) => handleKeyDown(e, 'minute')}
					placeholder="30"
					class="time-input minute-input"
					maxlength="2"
				/>
				<span class="field-label">Min</span>
			</div>
		</div>
	</div>
	
	<!-- Current Selection Display -->
	{#if value}
		<div class="current-time">
			<span class="current-label">Selected Time:</span>
			<span class="current-value">{value}</span>
		</div>
	{/if}
	
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.modern-time-input {
		background: white;
		border-radius: 12px;
		padding: 20px;
		border: 2px solid #e5e5e7;
		transition: border-color 0.3s ease;
	}

	.modern-time-input:focus-within {
		border-color: #007aff;
		box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
	}

	.time-label {
		display: block;
		font-size: 1.1em;
		font-weight: 600;
		color: #333;
		margin-bottom: 4px;
	}

	.label-hint {
		display: block;
		font-size: 0.85em;
		font-weight: 400;
		color: #666;
		margin-top: 2px;
	}


	.time-picker {
		margin: 16px 0;
	}

	.time-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: #f8f9fa;
		border-radius: 16px;
		padding: 24px;
		border: 1px solid #e5e5e7;
	}

	.time-field {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.time-input {
		width: 60px;
		height: 60px;
		background: white;
		border: 2px solid #e5e5e7;
		border-radius: 12px;
		text-align: center;
		font-size: 1.5em;
		font-weight: 600;
		color: #333;
		transition: all 0.2s ease;
	}

	.time-input:focus {
		outline: none;
		border-color: #007aff;
		box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
		transform: scale(1.05);
	}

	.time-separator {
		font-size: 2em;
		font-weight: 600;
		color: #007aff;
		margin: 0 8px;
	}

	.field-label {
		font-size: 0.8em;
		color: #666;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.ampm-toggle {
		background: #007aff;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 12px 16px;
		font-size: 1.2em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.ampm-toggle:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
	}

	.ampm-toggle.pm {
		background: #ff9500;
	}


	.current-time {
		background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
		color: white;
		padding: 16px;
		border-radius: 12px;
		text-align: center;
		margin: 16px 0;
	}

	.current-label {
		font-size: 0.9em;
		opacity: 0.9;
		display: block;
		margin-bottom: 4px;
	}

	.current-value {
		font-size: 1.4em;
		font-weight: 600;
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

	@media (max-width: 640px) {
		.time-display {
			padding: 16px;
			gap: 8px;
		}

		.time-input {
			width: 50px;
			height: 50px;
			font-size: 1.2em;
		}

		.time-separator {
			font-size: 1.5em;
		}

	}
</style>