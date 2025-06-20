<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { authStore } from '$lib/stores/auth';

	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			// Handle the auth callback
			const { data, error: authError } = await supabase.auth.getSession();
			
			if (authError) {
				console.error('Auth callback error:', authError);
				error = authError.message;
				return;
			}

			if (data?.session) {
				// Redirect to dashboard
				await goto('/dashboard');
			} else {
				// No session, redirect to login
				await goto('/auth/login');
			}
		} catch (err: unknown) {
			console.error('Callback processing error:', err);
			error = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-bg-base flex items-center justify-center p-6">
	<div class="w-full max-w-md text-center">
		{#if loading}
			<div class="bg-card rounded-xl px-10 py-8 shadow-themed-card border-2 border-border">
				<h2 class="text-2xl font-bold text-highlight mb-4">Completing Sign In...</h2>
				<div class="flex justify-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
				</div>
			</div>
		{:else if error}
			<div class="bg-card rounded-xl px-10 py-8 shadow-themed-card border-2 border-border">
				<h2 class="text-2xl font-bold text-red-400 mb-4">Authentication Error</h2>
				<p class="text-muted mb-6">{error}</p>
				<a href="/auth/login" class="btn btn-primary">Try Again</a>
			</div>
		{/if}
	</div>
</div>