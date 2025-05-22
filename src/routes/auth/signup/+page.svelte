<script lang="ts">
  import RoleSignupForm from '$lib/components/auth/RoleSignupForm.svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { page } from '$app/stores';
  
  // Redirect if already authenticated
  $effect(() => {
    if ($authStore.isAuthenticated && $page.url) {
      const role = $authStore.role;
      const redirectTo = role === 'student' ? '/student/dashboard' : '/dashboard';
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
    
    <RoleSignupForm />
    
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