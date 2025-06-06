<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { getRole, getIsAuthenticated } from '$lib/utils/storeHelpers';

	// Redirect if already authenticated
	$effect(() => {
		if (getIsAuthenticated($authStore)) {
			const role = getRole($authStore);
			const redirectTo = role === 'student' ? '/student/dashboard' : '/dashboard';
			void goto(redirectTo);
		}
	});

	// Handle auth errors from the redirect
	$effect(() => {
		if ($page.url) {
			const error = $page.url.searchParams.get('error');
			const error_description = $page.url.searchParams.get('error_description');
			if (error) {
				console.error('Auth error:', error, error_description);
			}
		}
	});
</script>

<div class="min-h-screen bg-bg-base flex items-center justify-center p-6">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-highlight">Teacher Dashboard</h1>
			<p class="text-muted mt-2">Sign in to continue</p>
		</div>

		<LoginForm />

		<div class="text-center mt-6">
			<p class="text-muted">
				Don't have an account?
				<a href="/auth/signup" class="text-purple hover:underline font-medium"> Sign up </a>
			</p>
			<p class="text-muted mt-2">
				<a href="/auth/reset-password" class="text-purple hover:underline"> Forgot password? </a>
			</p>
		</div>
	</div>
</div>
