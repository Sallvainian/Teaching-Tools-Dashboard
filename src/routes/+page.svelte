<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirect to dashboard on page load
	onMount(async () => {
		await goto('/dashboard');
	});
</script>

<div class="flex items-center justify-center h-screen">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-highlight mb-4">Teacher Dashboard</h1>
		<p class="text-dark-muted mb-6">Redirecting to dashboard...</p>
		<div
			class="w-12 h-12 border-4 border-dark-purple border-t-dark-highlight rounded-full animate-spin mx-auto"
		></div>
		<a href="/dashboard" class="text-dark-lavender hover:text-dark-highlight mt-6 inline-block"
			>Click here if you are not redirected</a
		>
	</div>
</div>
