<script lang="ts">
	import ProfileForm from '$lib/components/auth/ProfileForm.svelte';
	import { authStore, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/utils/storeHelpers';

	// Redirect if not authenticated
	$effect(() => {
		if (!getUser($authStore)) {
			void goto('/auth/login');
		}
	});
</script>

<div class="max-w-2xl mx-auto py-8 px-4">
	<h1 class="text-2xl font-bold text-highlight mb-8">Profile Settings</h1>

	{#if $user}
		<ProfileForm />
	{:else}
		<div class="bg-dark-card border border-dark-border p-6 rounded-xl">
			<p class="text-dark-muted">Loading profile...</p>
		</div>
	{/if}
</div>
