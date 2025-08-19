<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="theme-color" content="#007aff" />
</svelte:head>

<div class="app">
	<slot />
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f2f2f7;
		color: #333;
		line-height: 1.5;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		min-height: 100vh;
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
	}

	@media (max-width: 640px) {
		.app {
			padding: 12px;
		}
	}
</style>
