<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let fullName = '';
  let loading = $state(false);
  let error = $state('');
  
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
      await authStore.signUpWithEmail(email, password, fullName);
      // Success - no need to do anything as the auth store will update
    } catch (err: any) {
      error = err.message || 'Failed to sign up';
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md">
  <form onsubmit|preventDefault={handleSubmit} class="bg-base-200 rounded-lg px-8 pt-6 pb-8 mb-4 shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center">Create an Account</h2>
    
    {#if error}
      <div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
        <p>{error}</p>
      </div>
    {/if}
    
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2" for="fullName">
        Full Name
      </label>
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
      <label class="block text-sm font-medium mb-2" for="email">
        Email
      </label>
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
      <label class="block text-sm font-medium mb-2" for="password">
        Password
      </label>
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
      <label class="block text-sm font-medium mb-2" for="confirmPassword">
        Confirm Password
      </label>
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
      <a href="/auth/login" class="link link-hover text-sm">
        Already have an account? Sign in
      </a>
    </div>
  </form>
</div>