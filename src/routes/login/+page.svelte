<!-- Placeholder for future login page implementation -->
<script lang="ts">
  import { goto } from '$app/navigation';
  
  // Redirect to dashboard immediately since we don't have authentication
  goto('/dashboard');
</script>

<div class="flex min-h-screen items-center justify-center bg-dark-surface px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <h1 class="text-center text-3xl font-bold tracking-tight text-white">Teacher Dashboard</h1>
      <h2 class="mt-6 text-center text-2xl font-bold tracking-tight text-white">
        Redirecting to dashboard...
      </h2>
    </div>
  </div>
</div>