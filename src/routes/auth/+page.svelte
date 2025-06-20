<script>
  import { enhance } from '$app/forms'
</script>

<div class="min-h-screen bg-bg-base flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="bg-card rounded-xl px-10 py-8 shadow-themed-card border-2 border-border">
      <h1 class="text-2xl font-bold text-center text-highlight mb-6">Authentication</h1>
      
      <form method="POST" use:enhance class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-text mb-1">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class="w-full px-3 py-2 bg-bg-darker border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple text-text"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-text mb-1">Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            required
            class="w-full px-3 py-2 bg-bg-darker border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple text-text"
          />
        </div>
        
        <div class="space-y-2">
          <button
            type="submit"
            formaction="?/login"
            class="w-full btn btn-primary py-3"
          >
            Log in
          </button>
          
          <button
            type="submit"
            formaction="?/signup"
            class="w-full btn btn-secondary py-3"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  </div>
</div>