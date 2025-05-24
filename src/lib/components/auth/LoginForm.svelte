<script lang="ts">
  import { authStore, error as authError } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let showPassword = $state(false);
  let unsubscribe;
  
  onMount(() => {
    unsubscribe = authError.subscribe(err => {
      if (err) error = err;
    });
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
  
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!email || !password) {
      error = 'Please fill out all fields';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const success = await authStore.signIn(email, password);
      if (success) {
        goto('/dashboard');
      } else {
        if (!error) error = 'Invalid email or password';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Invalid email or password';
    } finally {
      loading = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<div class="w-full max-w-md">
  <div class="bg-gradient-to-br from-surface to-surface/50 backdrop-blur-sm rounded-xl px-8 pt-8 pb-10 shadow-themed-card border border-border/50">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-purple to-purple-light rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow">
        <span class="text-2xl font-bold text-white">T</span>
      </div>
      <h2 class="text-2xl font-bold text-highlight">Welcome Back</h2>
      <p class="text-sm text-text-base mt-2">Sign in to continue to your dashboard</p>
    </div>
    
    <form onsubmit={handleSubmit} class="space-y-6">
      {#if error}
        <div class="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm">{error}</p>
        </div>
      {/if}
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5 text-text-base" for="email">
            Email
          </label>
          <input
            bind:value={email}
            class="w-full px-4 py-2.5 bg-surface/50 text-highlight placeholder-muted border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition duration-200"
            id="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1.5 text-text-base" for="password">
            Password
          </label>
          <div class="relative">
            <input
              bind:value={password}
              class="w-full px-4 py-2.5 bg-surface/50 text-highlight placeholder-muted border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition duration-200 pr-10"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onclick={togglePasswordVisibility}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-highlight transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {#if showPassword}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                {/if}
              </svg>
            </button>
          </div>
          <div class="flex justify-end mt-1">
            <a href="/auth/reset-password" class="text-sm text-purple hover:text-purple-light transition-colors">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
      
      <button
        class="w-full bg-gradient-to-r from-purple to-purple-light text-white font-medium px-4 py-2.5 rounded-lg hover:from-purple-hover hover:to-purple-light focus:outline-none focus:ring-2 focus:ring-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 group relative overflow-hidden shadow-button"
        type="submit"
        disabled={loading}
      >
        <span class="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></span>
        {#if loading}
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        {:else}
          Sign in
        {/if}
      </button>
      
      <div class="text-center">
        <p class="text-text-base">
          Don't have an account?
          <a href="/auth/signup" class="text-purple hover:text-purple-light transition-colors font-medium">
            Sign up
          </a>
        </p>
      </div>
    </form>
  </div>
</div>
```