<script lang="ts">
	import '../app.css';
	// Core imports
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();

	// Main layout component
	import AppLayout from '$lib/components/AppLayout/AppLayout.svelte';
	import GlobalLoader from '$lib/components/GlobalLoader.svelte';

	// Get children prop for Svelte 5
	let { children } = $props();
</script>

<AppLayout>
	{@render children?.()}
</AppLayout>

<!-- Global loading overlay -->
<GlobalLoader />
