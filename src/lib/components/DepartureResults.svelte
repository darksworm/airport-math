<script lang="ts">
	import type { DepartureCalculation, RouteInfo } from '$lib/types/airport';
	import { formatTime, getDepartureSummary, getTimeUntilDeparture } from '$lib/services/departure';
	import { formatDuration } from '$lib/services/routing';
	import { onMount, onDestroy } from 'svelte';

	export let calculation: DepartureCalculation | null = null;
	export let route: RouteInfo | null = null;

	let interval: number;

	onMount(() => {
		// Update every minute for real-time countdown
		interval = setInterval(() => {
			// Force reactivity update
			calculation = calculation;
		}, 60000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	$: timeUntil = calculation ? getTimeUntilDeparture(calculation.leaveTime) : null;
	$: summary = calculation ? getDepartureSummary(calculation) : null;
</script>

{#if calculation && route}
	<div class="departure-results">
		<div class="results-header">
			<h2>🚀 Departure Plan</h2>
			{#if summary}
				<div class="summary-badge" class:urgent={timeUntil?.isOverdue || (timeUntil?.totalMinutes ?? 0) < 60}>
					{summary}
				</div>
			{/if}
		</div>

		<div class="main-result">
			<div class="leave-time">
				<div class="time-label">Leave at:</div>
				<div class="time-value">{formatTime(calculation.leaveTime)}</div>
			</div>
			
			{#if timeUntil && !timeUntil.isOverdue}
				<div class="countdown">
					<div class="countdown-label">Time remaining:</div>
					<div class="countdown-value">
						{timeUntil.hours}h {timeUntil.minutes}m
					</div>
				</div>
			{/if}
		</div>

		<div class="breakdown">
			<h3>📋 Breakdown</h3>
			<div class="breakdown-items">
				<div class="breakdown-item">
					<span class="item-icon">✈️</span>
					<span class="item-label">Flight Departure:</span>
					<span class="item-value">{formatTime(calculation.flightTime)}</span>
				</div>
				
				<div class="breakdown-item">
					<span class="item-icon">🏢</span>
					<span class="item-label">Airport Arrival Deadline:</span>
					<span class="item-value">{formatTime(calculation.arrivalDeadline)}</span>
				</div>
				
				<div class="breakdown-item">
					<span class="item-icon">⏰</span>
					<span class="item-label">Check-in Buffer:</span>
					<span class="item-value">{calculation.checkInBuffer} hours</span>
				</div>
				
				<div class="breakdown-item">
					<span class="item-icon">{route.mode.icon}</span>
					<span class="item-label">Travel Time ({route.mode.name}):</span>
					<span class="item-value">{formatDuration(calculation.travelTime)}</span>
				</div>
				
				<div class="breakdown-item">
					<span class="item-icon">🛡️</span>
					<span class="item-label">Safety Margin:</span>
					<span class="item-value">15 minutes</span>
				</div>
			</div>
		</div>

		<div class="timeline">
			<h3>📅 Timeline</h3>
			<div class="timeline-items">
				<div class="timeline-item" class:current={timeUntil && !timeUntil.isOverdue}>
					<div class="timeline-dot"></div>
					<div class="timeline-content">
						<div class="timeline-time">{formatTime(calculation.leaveTime)}</div>
						<div class="timeline-label">🚗 Leave home</div>
					</div>
				</div>
				
				<div class="timeline-item">
					<div class="timeline-dot"></div>
					<div class="timeline-content">
						<div class="timeline-time">{formatTime(calculation.arrivalDeadline)}</div>
						<div class="timeline-label">🏢 Arrive at airport</div>
					</div>
				</div>
				
				<div class="timeline-item">
					<div class="timeline-dot"></div>
					<div class="timeline-content">
						<div class="timeline-time">{formatTime(calculation.flightTime)}</div>
						<div class="timeline-label">✈️ Flight departure</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.departure-results {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 12px;
	}

	h2 {
		margin: 0;
		font-size: 1.2em;
		color: #333;
	}

	h3 {
		margin: 0 0 12px 0;
		font-size: 1.1em;
		color: #333;
	}

	.summary-badge {
		background: #34c759;
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 0.9em;
		font-weight: 600;
	}

	.summary-badge.urgent {
		background: #ff3b30;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	.main-result {
		background: #f0f8ff;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
		text-align: center;
		border-left: 4px solid #007aff;
	}

	.leave-time {
		margin-bottom: 16px;
	}

	.time-label {
		color: #666;
		font-size: 0.9em;
		margin-bottom: 4px;
	}

	.time-value {
		font-size: 2em;
		font-weight: bold;
		color: #007aff;
	}

	.countdown {
		padding-top: 16px;
		border-top: 1px solid #e5e5e7;
	}

	.countdown-label {
		color: #666;
		font-size: 0.9em;
		margin-bottom: 4px;
	}

	.countdown-value {
		font-size: 1.5em;
		font-weight: 600;
		color: #34c759;
	}

	.breakdown {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.breakdown-items {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.breakdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.item-icon {
		font-size: 1.2em;
		width: 24px;
		text-align: center;
	}

	.item-label {
		flex: 1;
		color: #666;
		font-size: 0.9em;
	}

	.item-value {
		font-weight: 600;
		color: #333;
	}

	.timeline {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
	}

	.timeline-items {
		display: flex;
		flex-direction: column;
		gap: 16px;
		position: relative;
		padding-left: 24px;
	}

	.timeline-items::before {
		content: '';
		position: absolute;
		left: 11px;
		top: 12px;
		bottom: 12px;
		width: 2px;
		background: #e5e5e7;
	}

	.timeline-item {
		display: flex;
		align-items: center;
		gap: 16px;
		position: relative;
	}

	.timeline-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #e5e5e7;
		position: absolute;
		left: -18px;
		z-index: 1;
	}

	.timeline-item.current .timeline-dot {
		background: #007aff;
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
	}

	.timeline-content {
		flex: 1;
	}

	.timeline-time {
		font-weight: 600;
		color: #333;
		margin-bottom: 2px;
	}

	.timeline-label {
		color: #666;
		font-size: 0.9em;
	}

	@media (max-width: 640px) {
		.results-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.time-value {
			font-size: 1.8em;
		}
		
		.countdown-value {
			font-size: 1.3em;
		}
	}
</style>