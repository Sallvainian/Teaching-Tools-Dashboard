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

	async function handleSubmit() {
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
				await new Promise((resolve) => setTimeout(resolve, 200));
				await goto('/dashboard');
			} else if (!error) {
				error = 'Invalid email or password';
			}
		} catch (err: any) {
			error = err.message || 'An error occurred during sign in';
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-md">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="bg-card rounded-xl px-10 py-8 shadow-themed-card border-2 border-border backdrop-blur-sm"
	>
		<h2 class="text-3xl font-bold mb-8 text-center text-highlight">Sign In</h2>

		{#if error}
			<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		<div class="mb-6">
			<label class="block text-sm font-medium mb-2 text-text-base" for="email"> Email </label>
			<input
				bind:value={email}
				class="input input-bordered w-full bg-surface border border-border py-3 px-4 text-base text-text-hover"
			style="color: var(--text-hover);"
				id="email"
				type="email"
				placeholder="Email"
				required
			/>
		</div>

		<div class="mb-8">
			<label class="block text-sm font-medium mb-2 text-text-base" for="password"> Password </label>
			<input
				bind:value={password}
				class="input input-bordered w-full bg-surface border border-border py-3 px-4 text-base text-text-hover"
			style="color: var(--text-hover);"
				id="password"
				type="password"
				placeholder="Password"
				required
			/>
		</div>

		<div class="mt-6">
			<button class="btn btn-primary w-full py-3 text-lg font-semibold" type="submit" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-md"></span>
				{:else}
					Sign In
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	input::placeholder {
		color: #cbd5e1 !important;
		opacity: 1 !important;
	}
	
	.dark input::placeholder {
		color: #94a3b8 !important;
	}
</style>