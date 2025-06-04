<script lang="ts">
	import RoleSignupForm from '$lib/components/auth/RoleSignupForm.svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { getRole, getIsAuthenticated } from '$lib/utils/storeHelpers';

	// Redirect if already authenticated
	$effect(() => {
		if (getIsAuthenticated($authStore) && $page.url) {
			const role = getRole($authStore);
			const redirectTo = role === 'student' ? '/student/dashboard' : '/dashboard';
			void goto(redirectTo);
		}
	});
</script>

<div class="min-h-screen bg-bg-base flex items-center justify-center p-6">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-highlight">Teacher Dashboard</h1>
			<p class="text-muted mt-2">Create your account</p>
		</div>

		<RoleSignupForm />

		<div class="text-center mt-6">
			<p class="text-muted">
				Already have an account?
				<a href="/auth/login" class="text-purple hover:underline font-medium"> Sign in </a>
			</p>
		</div>
	</div>
</div>
