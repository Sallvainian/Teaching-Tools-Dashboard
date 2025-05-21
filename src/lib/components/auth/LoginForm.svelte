<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  
  async function handleSubmit() {
    if (!email || !password) {
      error = 'Please fill out all fields';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      await authStore.signInWithEmail(email, password);
      // Success - no need to do anything as the auth store will update
    } catch (err: any) {
      error = err.message || 'Failed to sign in';
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md">
  <form on:submit={(e) => { e.preventDefault(); handleSubmit(); }} class="bg-base-200 rounded-lg px-8 pt-6 pb-8 mb-4 shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center">Sign In</h2>
    
    {#if error}
      <div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
        <p>{error}</p>
      </div>
    {/if}
    
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
    
    <div class="mb-6">
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
    
    <div class="flex items-center justify-between">
      <button
        class="btn btn-primary w-full {loading ? 'loading' : ''}"
        type="submit"
        disabled={loading}
      >
        Sign In
      </button>
    </div>
    
    <div class="text-center mt-4">
      <a href="/auth/signup" class="link link-hover text-sm">
        Need an account? Sign up
      </a>
    </div>
    
    <div class="text-center mt-2">
      <a href="/auth/reset-password" class="link link-hover text-sm">
        Forgot your password?
      </a>
    </div>
  </form>
</div>