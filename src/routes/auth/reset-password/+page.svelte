<script lang="ts">
	import ResetPasswordForm from '$lib/components/auth/ResetPasswordForm.svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth';

	// Redirect if already authenticated
	$effect(() => {
		if ($isAuthenticated) {
			void goto('/dashboard');
		}
	});
</script>

<div class="min-h-screen bg-bg-base flex items-center justify-center p-6">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-highlight">Reset Password</h1>
			<p class="text-muted mt-2">Enter your email to receive a reset link</p>
		</div>

		<ResetPasswordForm />

		<div class="text-center mt-6">
			<p class="text-muted">
				Remember your password?
				<a href="/auth/login" class="text-purple hover:underline font-medium"> Sign in </a>
			</p>
		</div>
	</div>
</div>
