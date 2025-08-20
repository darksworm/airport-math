<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let value: string = '';
	export let error: string = '';
	
	const dispatch = createEventDispatcher();
	
	let hours: string = '';
	let minutes: string = '';
	let isPM: boolean = false;
	let inputMode: 'picker' | 'manual' = 'picker';
	
	// Detect user's time format preference (12h vs 24h)
	const use24Hour = (() => {
		try {
			const testDate = new Date('2023-01-01 13:00');
			const timeString = testDate.toLocaleTimeString(undefined, { 
				hour: 'numeric',
				minute: '2-digit'
			});
			return !timeString.includes('PM') && !timeString.includes('AM');
		} catch {
			// Default to 24-hour if detection fails
			return true;
		}
	})();
	
	// Parse initial value
	$: if (value && value !== formatTime()) {
		parseTimeValue(value);
	}
	
	function parseTimeValue(timeStr: string) {
		if (!timeStr || !timeStr.includes(':')) return;
		
		const [h, m] = timeStr.split(':');
		const hourNum = parseInt(h);
		
		if (use24Hour) {
			hours = hourNum.toString();
			minutes = m;
		} else {
			if (hourNum === 0) {
				hours = '12';
				isPM = false;
			} else if (hourNum <= 12) {
				hours = hourNum.toString();
				isPM = false;
			} else {
				hours = (hourNum - 12).toString();
				isPM = true;
			}
			minutes = m;
		}
	}
	
	function formatTime(): string {
		if (!hours || !minutes) return '';
		
		let h = parseInt(hours);
		
		if (use24Hour) {
			// 24-hour format: just use the hours as-is
			return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
		} else {
			// 12-hour format: convert to 24-hour for internal storage
			if (isPM && h !== 12) h += 12;
			if (!isPM && h === 12) h = 0;
			return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
		}
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
		
		if (use24Hour) {
			if (parseInt(val) > 23) val = '23';
			if (parseInt(val) < 0 && val.length === 2) val = '0';
		} else {
			if (parseInt(val) > 12) val = '12';
			if (parseInt(val) < 1 && val.length === 2) val = '1';
		}
		
		hours = val;
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
	
	function toggleAmPm() {
		isPM = !isPM;
		handleTimeChange();
	}
	
	function setPresetTime(time: string) {
		const [h, m] = time.split(':');
		const hour = parseInt(h);
		
		if (use24Hour) {
			hours = hour.toString();
		} else {
			if (hour === 0) {
				hours = '12';
				isPM = false;
			} else if (hour <= 12) {
				hours = hour.toString();
				isPM = false;
			} else {
				hours = (hour - 12).toString();
				isPM = true;
			}
		}
		
		minutes = m;
		handleTimeChange();
	}
	
	const commonTimes = [
		{ label: 'Early Morning', times: ['06:00', '07:00', '08:00'] },
		{ label: 'Morning', times: ['09:00', '10:00', '11:00'] },
		{ label: 'Midday', times: ['12:00', '13:00', '14:00'] },
		{ label: 'Afternoon', times: ['15:00', '16:00', '17:00'] },
		{ label: 'Evening', times: ['18:00', '19:00', '20:00'] },
		{ label: 'Night', times: ['21:00', '22:00', '23:00'] }
	];
</script>

<div class="modern-time-input">
	<label class="time-label">
		✈️ Flight Departure Time
		<span class="label-hint">When does your flight leave?</span>
	</label>
	
	<!-- Mode Toggle -->
	<div class="mode-toggle">
		<button 
			class="mode-btn" 
			class:active={inputMode === 'picker'}
			on:click={() => inputMode = 'picker'}
		>
			🕐 Time Picker
		</button>
		<button 
			class="mode-btn" 
			class:active={inputMode === 'manual'}
			on:click={() => inputMode = 'manual'}
		>
			⌨️ Quick Select
		</button>
	</div>
	
	{#if inputMode === 'picker'}
		<!-- Custom Time Picker -->
		<div class="time-picker">
			<div class="time-display">
				<div class="time-field">
					<input
						type="text"
						bind:value={hours}
						on:input={handleHourChange}
						placeholder={use24Hour ? "14" : "12"}
						class="time-input hour-input"
						maxlength="2"
					/>
					<span class="field-label">Hour</span>
				</div>
				
				<div class="time-separator">:</div>
				
				<div class="time-field">
					<input
						type="text"
						bind:value={minutes}
						on:input={handleMinuteChange}
						placeholder="00"
						class="time-input minute-input"
						maxlength="2"
					/>
					<span class="field-label">Min</span>
				</div>
				
				{#if !use24Hour}
					<button class="ampm-toggle" class:pm={isPM} on:click={toggleAmPm}>
						{isPM ? 'PM' : 'AM'}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Quick Time Selection -->
		<div class="quick-select">
			{#each commonTimes as timeGroup}
				<div class="time-group">
					<div class="group-label">{timeGroup.label}</div>
					<div class="time-buttons">
						{#each timeGroup.times as time}
							<button 
								class="time-preset-btn"
								on:click={() => setPresetTime(time)}
							>
								{time.split(':')[0]}:{time.split(':')[1]}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
	
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

	.mode-toggle {
		display: flex;
		gap: 8px;
		margin: 16px 0;
		background: #f8f9fa;
		border-radius: 8px;
		padding: 4px;
	}

	.mode-btn {
		flex: 1;
		background: transparent;
		border: none;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.9em;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #666;
	}

	.mode-btn.active {
		background: #007aff;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
	}

	.mode-btn:hover:not(.active) {
		background: #e5e5e7;
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

	.quick-select {
		display: grid;
		gap: 16px;
		margin: 16px 0;
	}

	.time-group {
		background: #f8f9fa;
		border-radius: 12px;
		padding: 16px;
	}

	.group-label {
		font-size: 0.9em;
		font-weight: 600;
		color: #666;
		margin-bottom: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.time-buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.time-preset-btn {
		background: white;
		border: 1px solid #e5e5e7;
		border-radius: 8px;
		padding: 12px;
		font-size: 1em;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #333;
	}

	.time-preset-btn:hover {
		background: #007aff;
		color: white;
		border-color: #007aff;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
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

		.time-buttons {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>