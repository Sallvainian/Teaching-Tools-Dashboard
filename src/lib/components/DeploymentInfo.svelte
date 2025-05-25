<script lang="ts">
	import { dev } from '$app/environment';
	
	const release = import.meta.env.SENTRY_RELEASE || 'development';
	const environment = import.meta.env.MODE;
	const buildTime = import.meta.env.BUILD_TIME || new Date().toISOString();
</script>

{#if dev}
	<div class="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow-lg opacity-75 hover:opacity-100 transition-opacity">
		<div>Environment: {environment}</div>
		<div>Release: {release}</div>
		<div>Built: {new Date(buildTime).toLocaleString()}</div>
	</div>
{/if}