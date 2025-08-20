<script lang="ts">
	import type { DepartureCalculation, RouteInfo } from '$lib/types/airport';
	import { formatTime, getTimeUntilDeparture, isDepartureOverdue } from '$lib/services/departure';
	
	export let calculation: DepartureCalculation;
	export let route: RouteInfo;
	
	$: timeUntil = getTimeUntilDeparture(calculation.leaveTime);
	$: isOverdue = isDepartureOverdue(calculation.leaveTime);
	
	function formatMinutes(minutes: number): string {
		if (minutes === 0) return '0 min';
		if (minutes < 60) return `${minutes} min`;
		
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	}
	
	$: departureStatus = isOverdue 
		? `⚠️ You should have left ${timeUntil.hours}h ${timeUntil.minutes}m ago!`
		: timeUntil.totalMinutes < 30 
			? `🚨 Leave in ${timeUntil.totalMinutes} minutes!`
			: `⏰ Leave in ${timeUntil.hours}h ${timeUntil.minutes}m`;
</script>

<div class="departure-results">
	<div class="main-result">
		<h2>🎯 Your Departure Plan</h2>
		<div class="departure-time" class:urgent={timeUntil.totalMinutes < 60} class:overdue={isOverdue}>
			<div class="time-display">
				<span class="time">{formatTime(calculation.leaveTime, { use24Hour: true })}</span>
				<span class="label">Leave Home</span>
			</div>
			<div class="status">
				{departureStatus}
			</div>
		</div>
	</div>
	
	<div class="timeline">
		<h3>📋 Time Breakdown</h3>
		<div class="timeline-items">
			<div class="timeline-item">
				<div class="time-badge travel">
					{formatMinutes(calculation.breakdown.travel)}
				</div>
				<div class="item-content">
					<strong>Travel to Airport</strong>
					<small>{route.mode.icon} {route.mode.name}</small>
				</div>
			</div>
			
			{#if calculation.breakdown.baggage > 0}
				<div class="timeline-item">
					<div class="time-badge baggage">
						{formatMinutes(calculation.breakdown.baggage)}
					</div>
					<div class="item-content">
						<strong>Baggage Check-in</strong>
						<small>Drop off checked bags</small>
					</div>
				</div>
			{/if}
			
			<div class="timeline-item">
				<div class="time-badge security">
					{formatMinutes(calculation.breakdown.security)}
				</div>
				<div class="item-content">
					<strong>Security Screening</strong>
					<small>Security checkpoint</small>
				</div>
			</div>
			
			{#if calculation.breakdown.passport > 0}
				<div class="timeline-item">
					<div class="time-badge passport">
						{formatMinutes(calculation.breakdown.passport)}
					</div>
					<div class="item-content">
						<strong>Passport Control</strong>
						<small>International departure</small>
					</div>
				</div>
			{/if}
			
			<div class="timeline-item">
				<div class="time-badge checkin">
					{formatMinutes(calculation.breakdown.checkIn)}
				</div>
				<div class="item-content">
					<strong>Gate Wait Time</strong>
					<small>Relax before boarding</small>
				</div>
			</div>
			
			{#if calculation.breakdown.safety > 0}
				<div class="timeline-item">
					<div class="time-badge safety">
						{formatMinutes(calculation.breakdown.safety)}
					</div>
					<div class="item-content">
						<strong>Safety Buffer</strong>
						<small>Extra time for unexpected delays</small>
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<div class="summary-stats">
		<div class="stat">
			<span class="stat-value">{formatTime(calculation.arrivalDeadline, { use24Hour: true })}</span>
			<span class="stat-label">Arrive at Airport</span>
		</div>
		<div class="stat">
			<span class="stat-value">{formatTime(calculation.flightTime, { use24Hour: true })}</span>
			<span class="stat-label">Flight Departure</span>
		</div>
		<div class="stat">
			<span class="stat-value">{formatMinutes(calculation.totalBuffer + calculation.travelTime)}</span>
			<span class="stat-label">Total Time Needed</span>
		</div>
	</div>
</div>

<style>
	.departure-results {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.main-result h2 {
		margin: 0 0 20px 0;
		font-size: 1.3em;
		color: #333;
	}

	.departure-time {
		background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
		border-radius: 12px;
		padding: 24px;
		color: white;
		text-align: center;
		margin-bottom: 32px;
	}

	.departure-time.urgent {
		background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
	}

	.departure-time.overdue {
		background: linear-gradient(135deg, #ff3b30 0%, #d70015 100%);
	}

	.time-display {
		margin-bottom: 12px;
	}

	.time {
		display: block;
		font-size: 2.5em;
		font-weight: 700;
		line-height: 1;
		margin-bottom: 4px;
	}

	.label {
		font-size: 1.1em;
		opacity: 0.9;
	}

	.status {
		font-size: 1.1em;
		font-weight: 600;
		opacity: 0.95;
	}

	.timeline {
		margin-bottom: 32px;
	}

	.timeline h3 {
		margin: 0 0 20px 0;
		font-size: 1.1em;
		color: #333;
	}

	.timeline-items {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.timeline-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #e5e5e7;
	}

	.time-badge {
		background: #fff;
		border-radius: 20px;
		padding: 6px 12px;
		font-weight: 600;
		font-size: 0.85em;
		min-width: 60px;
		text-align: center;
		border: 2px solid;
	}

	.time-badge.travel {
		color: #007aff;
		border-color: #007aff;
	}

	.time-badge.baggage {
		color: #ff9500;
		border-color: #ff9500;
	}

	.time-badge.security {
		color: #ff3b30;
		border-color: #ff3b30;
	}

	.time-badge.passport {
		color: #af52de;
		border-color: #af52de;
	}

	.time-badge.checkin {
		color: #34c759;
		border-color: #34c759;
	}

	.time-badge.safety {
		color: #8e8e93;
		border-color: #8e8e93;
	}

	.item-content {
		flex: 1;
	}

	.item-content strong {
		display: block;
		color: #333;
		margin-bottom: 2px;
	}

	.item-content small {
		color: #666;
		font-size: 0.85em;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 16px;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}

	.stat {
		text-align: center;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.stat-value {
		display: block;
		font-size: 1.2em;
		font-weight: 600;
		color: #007aff;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 0.85em;
		color: #666;
	}

	@media (max-width: 640px) {
		.departure-results {
			padding: 16px;
		}
		
		.time {
			font-size: 2em;
		}
		
		.timeline-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}
		
		.summary-stats {
			grid-template-columns: 1fr;
		}
	}
</style>