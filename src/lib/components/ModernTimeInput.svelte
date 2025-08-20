<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let value: string = '';
	export let error: string = '';
	
	const dispatch = createEventDispatcher();
	
	let dropdownOpen = false;
	let selectedHour = '12';
	let selectedMinute = '00';
	
	// Generate hour and minute options
	const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
	const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
	
	// Parse initial value
	$: {
		if (value && value.includes(':')) {
			const [h, m] = value.split(':');
			selectedHour = h.padStart(2, '0');
			selectedMinute = m.padStart(2, '0');
		}
	}
	
	// Update value when selections change
	$: {
		const newValue = `${selectedHour}:${selectedMinute}`;
		if (newValue !== value && selectedHour && selectedMinute) {
			dispatch('change', newValue);
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
	}
	
	function selectMinute(minute: string) {
		selectedMinute = minute;
		// Auto-close after minute selection for better UX
		closeDropdown();
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			dispatch('submit', `${selectedHour}:${selectedMinute}`);
			closeDropdown();
		}
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}
</script>

<div class="modern-time-input" on:keydown={handleKeyDown}>
	<div class="time-input-container">
		<button 
			class="time-display-input" 
			class:open={dropdownOpen}
			class:error={!!error}
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

	@media (max-width: 640px) {
		.modern-time-input {
			padding: 16px;
		}
	}
</style>