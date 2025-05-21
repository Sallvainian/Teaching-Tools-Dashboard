<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
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
      const success = await authStore.signIn(email, password);
      if (success) {
        // Redirect based on role
        const unsubscribe = authStore.subscribe(state => {
          if (state.isStudent) {
            goto('/student/dashboard');
          } else if (state.isTeacher) {
            goto('/dashboard');
          }
          unsubscribe();
        });
      } else {
        // Get error from auth store
        const unsubscribe = authStore.error.subscribe(authError => {
          error = authError || 'Failed to sign in';
          unsubscribe();
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to sign in';
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md">
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="bg-dark-surface rounded-lg px-8 pt-6 pb-8 mb-4 shadow-dark">
    <h2 class="text-2xl font-bold mb-6 text-center text-dark-highlight">Sign In</h2>
    
    {#if error}
      <div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
        <p>{error}</p>
      </div>
    {/if}
    
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2 text-dark-text" for="email">
        Email
      </label>
      <input
        bind:value={email}
        class="input input-bordered w-full bg-dark-surface-light border-dark-border"
        id="email"
        type="email"
        placeholder="Email"
        required
      />
    </div>
    
    <div class="mb-6">
      <label class="block text-sm font-medium mb-2 text-dark-text" for="password">
        Password
      </label>
      <input
        bind:value={password}
        class="input input-bordered w-full bg-dark-surface-light border-dark-border"
        id="password"
        type="password"
        placeholder="Password"
        required
      />
    </div>
    
    <div class="flex items-center justify-between">
      <button
        class="btn btn-primary w-full"
        type="submit"
        disabled={loading}
      >
        {#if loading}
          <span class="loading loading-spinner loading-md"></span>
        {:else}
          Sign In
        {/if}
      </button>
    </div>
  </form>
</div>