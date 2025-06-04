<script lang="ts">
	import { authStore } from '$lib/stores/auth';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let fullName = $state('');
	let loading = $state(false);
	let error = $state('');
	let showResendConfirmation = $state(false);

	async function resendConfirmation() {
		loading = true;
		error = '';

		try {
			// Use resetPassword as a way to send a new confirmation email
			const success = await authStore.resetPassword(email);
			if (success) {
				error = 'Confirmation email sent! Please check your inbox.';
				showResendConfirmation = false;
			} else {
				error = 'Failed to resend confirmation email';
			}
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to resend confirmation email';
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || !fullName) {
			error = 'Please fill out all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			await authStore.signUp(email, password, { full_name: fullName });
			// Success - no need to do anything as the auth store will update
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to sign up';

			// Check if this is a "user already exists" error
			if (err instanceof Error && 
				(err.message.includes('already registered') || err.message.includes('already exists'))) {
				showResendConfirmation = true;
			}
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
		class="bg-surface rounded-lg px-8 pt-6 pb-8 mb-4 shadow-themed-card"
	>
		<h2 class="text-2xl font-bold mb-6 text-center">Create an Account</h2>

		{#if error}
			<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
				<p>{error}</p>

				{#if showResendConfirmation}
					<div class="mt-3">
						<p class="text-sm mb-2">This email is already registered but hasn't been confirmed.</p>
						<button
							onclick={resendConfirmation}
							class="btn btn-sm btn-outline {loading ? 'loading' : ''}"
							disabled={loading}
						>
							Resend Confirmation Email
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2" for="fullName"> Full Name </label>
			<input
				bind:value={fullName}
				class="input input-bordered w-full"
				id="fullName"
				type="text"
				placeholder="Full Name"
				required
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2" for="email"> Email </label>
			<input
				bind:value={email}
				class="input input-bordered w-full"
				id="email"
				type="email"
				placeholder="Email"
				required
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2" for="password"> Password </label>
			<input
				bind:value={password}
				class="input input-bordered w-full"
				id="password"
				type="password"
				placeholder="Password"
				required
			/>
		</div>

		<div class="mb-6">
			<label class="block text-sm font-medium mb-2" for="confirmPassword"> Confirm Password </label>
			<input
				bind:value={confirmPassword}
				class="input input-bordered w-full"
				id="confirmPassword"
				type="password"
				placeholder="Confirm Password"
				required
			/>
		</div>

		<div class="flex items-center justify-between">
			<button
				class="btn btn-primary w-full {loading ? 'loading' : ''}"
				type="submit"
				disabled={loading}
			>
				Sign Up
			</button>
		</div>

		<div class="text-center mt-4">
			<a href="/auth/login" class="link link-hover text-sm"> Already have an account? Sign in </a>
		</div>
	</form>
</div>
