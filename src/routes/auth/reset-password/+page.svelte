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

<div class="min-h-screen bg-dark-bg flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white">Reset Password</h1>
      <p class="text-gray-400 mt-2">Enter your email to receive a reset link</p>
    </div>
    
    <ResetPasswordForm />
    
    <div class="text-center mt-6">
      <p class="text-gray-400">
        Remember your password? 
        <a href="/auth/login" class="text-dark-highlight hover:underline font-medium">
          Sign in
        </a>
      </p>
    </div>
  </div>
</div>