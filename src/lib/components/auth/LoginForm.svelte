<script lang="ts">
	import { authStore, error as authError } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	$effect(() => {
		if ($authError) error = $authError as string;
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
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'An error occurred during sign in';
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
			<div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
				<p class="text-sm text-red-400">{error}</p>
			</div>
		{/if}

		<div class="space-y-6">
			<div>
				<label for="email" class="block text-sm font-medium text-muted mb-2">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:outline-none focus:border-purple transition-colors text-text placeholder-muted"
					placeholder="teacher@example.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-muted mb-2">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:outline-none focus:border-purple transition-colors text-text placeholder-muted"
					placeholder="••••••••"
				/>
			</div>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full mt-8 px-6 py-3 bg-purple text-white font-semibold rounded-lg hover:bg-purple-hover focus:outline-none focus:ring-2 focus:ring-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
		>
			{loading ? 'Signing in...' : 'Sign In'}
		</button>
	</form>
</div>
