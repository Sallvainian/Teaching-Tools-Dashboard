<script lang="ts">
  import SignupForm from '$lib/components/auth/SignupForm.svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/stores/auth';
  import { page } from '$app/stores';
  
  // Redirect if already authenticated
  $effect(() => {
    if ($isAuthenticated && $page.url) {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard';
      goto(redirectTo);
    }
  });
</script>

<div class="min-h-screen bg-dark-bg flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white">Teacher Dashboard</h1>
      <p class="text-gray-400 mt-2">Create your account</p>
    </div>
    
    <SignupForm />
    
    <div class="text-center mt-6">
      <p class="text-gray-400">
        Already have an account? 
        <a href="/auth/login" class="text-dark-highlight hover:underline font-medium">
          Sign in
        </a>
      </p>
    </div>
  </div>
</div>