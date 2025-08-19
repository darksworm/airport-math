<script lang="ts">
	export let title: string;
	export let summary: string;
	export let icon: string;
	export let onEdit: (() => void) | undefined = undefined;
</script>

<div class="step-summary">
	<div class="summary-content">
		<div class="summary-icon">{icon}</div>
		<div class="summary-info">
			<div class="summary-title">{title}</div>
			<div class="summary-text">{summary}</div>
		</div>
	</div>
	{#if onEdit}
		<button class="edit-button" on:click={onEdit}>
			Edit
		</button>
	{/if}
</div>

<style>
	.step-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #f8f9fa;
		border: 1px solid #e5e5e7;
		border-radius: 8px;
		margin-bottom: 12px;
		transition: all 0.2s ease;
	}

	.step-summary:hover {
		background: #f0f8ff;
		border-color: #007aff;
	}

	.summary-content {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.summary-icon {
		font-size: 1.2em;
		width: 24px;
		text-align: center;
		color: #34c759;
	}

	.summary-info {
		flex: 1;
	}

	.summary-title {
		font-size: 0.9em;
		font-weight: 600;
		color: #333;
		margin-bottom: 2px;
	}

	.summary-text {
		font-size: 0.85em;
		color: #666;
	}

	.edit-button {
		background: none;
		border: 1px solid #ccc;
		color: #666;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.8em;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-button:hover {
		background: #007aff;
		border-color: #007aff;
		color: white;
	}
</style>