<script lang="ts">
	import { authStore, error as authError } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	$effect(() => {
		if ($authError) error = $authError;
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !password) {
			error = 'Please fill out all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const success = await authStore.signIn(email, password);
			if (success) {
				// Add a small delay to ensure auth state propagates
				await new Promise(resolve => setTimeout(resolve, 200));
				await goto('/dashboard');
			} else if (!error) {
				error = 'Invalid email or password';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Invalid email or password';
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-md">
	<form
		onsubmit={handleSubmit}
		class="bg-surface rounded-lg px-8 pt-6 pb-8 mb-4 shadow-themed-card"
	>
		<h2 class="text-2xl font-bold mb-6 text-center text-highlight">Sign In</h2>

		{#if error}
			<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2 text-text-base" for="email"> Email </label>
			<input
				bind:value={email}
				class="input input-bordered w-full bg-surface border-border"
				id="email"
				type="email"
				placeholder="Email"
				required
			/>
		</div>

		<div class="mb-6">
			<label class="block text-sm font-medium mb-2 text-text-base" for="password"> Password </label>
			<input
				bind:value={password}
				class="input input-bordered w-full bg-surface border-border"
				id="password"
				type="password"
				placeholder="Password"
				required
			/>
		</div>

		<div class="flex items-center justify-between">
			<button class="btn btn-primary w-full" type="submit" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-md"></span>
				{:else}
					Sign In
				{/if}
			</button>
		</div>
	</form>
</div>
