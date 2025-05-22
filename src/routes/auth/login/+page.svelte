<script lang="ts">
  import LoginForm from '$lib/components/auth/LoginForm.svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { page } from '$app/stores';
  
  // Redirect if already authenticated
  $effect(() => {
    if ($authStore.isAuthenticated) {
      const role = $authStore.role;
      const redirectTo = role === 'student' ? '/student/dashboard' : '/dashboard';
      goto(redirectTo);
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

<div class="min-h-screen bg-dark-bg flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white">Teacher Dashboard</h1>
      <p class="text-gray-400 mt-2">Sign in to continue</p>
    </div>
    
    <LoginForm />
    
    <div class="text-center mt-6">
      <p class="text-gray-400">
        Don't have an account? 
        <a href="/auth/signup" class="text-dark-highlight hover:underline font-medium">
          Sign up
        </a>
      </p>
      <p class="text-gray-400 mt-2">
        <a href="/auth/reset-password" class="text-dark-highlight hover:underline">
          Forgot password?
        </a>
      </p>
    </div>

    <!-- Development mode warning -->
    {#if import.meta.env.DEV}
      <div class="mt-8 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
        <p class="text-yellow-400 text-sm">
          <strong>Development Mode:</strong> If Supabase is not configured, you can use the app in offline mode. 
          Go to <a href="/settings" class="underline">Settings</a> to toggle data storage mode.
        </p>
      </div>
    {/if}
  </div>
</div>