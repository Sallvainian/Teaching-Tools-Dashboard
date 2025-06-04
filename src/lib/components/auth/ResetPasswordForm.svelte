<script lang="ts">
	import { authStore } from '$lib/stores/auth';

	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit() {
		if (!email) {
			error = 'Please enter your email';
			return;
		}

		loading = true;
		error = '';
		success = false;

		try {
			await authStore.resetPassword(email);
			success = true;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to reset password';
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
		class="bg-base-200 rounded-lg px-8 pt-6 pb-8 mb-4 shadow-md"
	>
		<h2 class="text-2xl font-bold mb-6 text-center">Reset Password</h2>

		{#if error}
			<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="bg-success/20 text-success px-4 py-3 rounded mb-4" role="alert">
				<p>We've sent a password reset link to your email.</p>
			</div>
		{/if}

		<div class="mb-6">
			<label class="block text-sm font-medium mb-2" for="email"> Email </label>
			<input
				bind:value={email}
				class="input input-bordered w-full"
				id="email"
				type="email"
				placeholder="Enter your email"
				required
			/>
		</div>

		<div class="flex items-center justify-between">
			<button
				class="btn btn-primary w-full {loading ? 'loading' : ''}"
				type="submit"
				disabled={loading}
			>
				Reset Password
			</button>
		</div>

		<div class="text-center mt-4">
			<a href="/auth/login" class="link link-hover text-sm"> Back to login </a>
		</div>
	</form>
</div>
