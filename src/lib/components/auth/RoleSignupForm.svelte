<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import type { StudentSignupData, TeacherSignupData } from '$lib/types/auth';
  import type { UserRole } from '$lib/types/database-updated';
  
  let step: 'role' | 'details' = $state('role');
  let selectedRole: UserRole | null = $state(null);
  
  // Form fields
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let fullName = $state('');
  let joinCode = $state('');
  let schoolName = $state('');
  
  let isLoading = $state(false);
  let error = $state('');
  
  function selectRole(role: UserRole) {
    selectedRole = role;
    step = 'details';
  }
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';
    
    // Validate password match
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    // Validate required fields
    if (!email || !password || !fullName) {
      error = 'Please fill in all required fields';
      return;
    }
    
    isLoading = true;
    
    try {
      let success = false;
      
      if (selectedRole === 'student') {
        const data: StudentSignupData = {
          email,
          password,
          fullName,
          joinCode: joinCode || undefined
        };
        success = await authStore.signUpStudent(data);
      } else if (selectedRole === 'teacher') {
        const data: TeacherSignupData = {
          email,
          password,
          fullName,
          schoolName: schoolName || undefined
        };
        success = await authStore.signUpTeacher(data);
      }
      
      if (success) {
        // Check if email verification is required
        error = 'Please check your email to verify your account';
        setTimeout(() => {
          goto('/auth/login');
        }, 3000);
      } else {
        // Get error from store
        const { error: authError } = await authStore;
        error = authError || 'Signup failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Signup failed';
    } finally {
      isLoading = false;
    }
  }
  
  function goBack() {
    step = 'role';
    selectedRole = null;
  }
</script>

<div class="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-dark-highlight">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-dark-text">
        Choose your role to get started
      </p>
    </div>

    {#if step === 'role'}
      <div class="space-y-4">
        <button
          on:click={() => selectRole('teacher')}
          class="w-full flex flex-col items-center px-6 py-4 border border-dark-border rounded-lg hover:bg-dark-surface transition-colors"
        >
          <svg class="w-12 h-12 text-dark-purple-light mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 class="text-lg font-semibold text-dark-text">I'm a Teacher</h3>
          <p class="text-sm text-gray-400 text-center mt-1">
            Create and manage classes, track student progress, and create educational games
          </p>
        </button>

        <button
          on:click={() => selectRole('student')}
          class="w-full flex flex-col items-center px-6 py-4 border border-dark-border rounded-lg hover:bg-dark-surface transition-colors"
        >
          <svg class="w-12 h-12 text-dark-purple-light mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
          <h3 class="text-lg font-semibold text-dark-text">I'm a Student</h3>
          <p class="text-sm text-gray-400 text-center mt-1">
            Join classes, view your progress, and create your own Jeopardy games
          </p>
        </button>
      </div>
    {:else if step === 'details'}
      <form on:submit={handleSubmit} class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="full-name" class="sr-only">Full name</label>
            <input
              id="full-name"
              type="text"
              bind:value={fullName}
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text rounded-t-md focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm"
              placeholder="Full name"
            />
          </div>
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              type="email"
              bind:value={email}
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              autocomplete="new-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              bind:value={confirmPassword}
              autocomplete="new-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm {selectedRole === 'student' ? '' : 'rounded-b-md'}"
              placeholder="Confirm password"
            />
          </div>
          
          {#if selectedRole === 'student'}
            <div>
              <label for="join-code" class="sr-only">Class join code (optional)</label>
              <input
                id="join-code"
                type="text"
                bind:value={joinCode}
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text rounded-b-md focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm"
                placeholder="Class join code (optional)"
              />
            </div>
          {:else if selectedRole === 'teacher'}
            <div>
              <label for="school-name" class="sr-only">School name (optional)</label>
              <input
                id="school-name"
                type="text"
                bind:value={schoolName}
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-dark-border bg-dark-surface placeholder-gray-500 text-dark-text rounded-b-md focus:outline-none focus:ring-dark-purple-light focus:border-dark-purple-light focus:z-10 sm:text-sm"
                placeholder="School name (optional)"
              />
            </div>
          {/if}
        </div>

        {#if error}
          <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        {/if}

        <div class="flex gap-4">
          <button
            type="button"
            on:click={goBack}
            class="flex-1 flex justify-center py-2 px-4 border border-dark-border rounded-md shadow-sm text-sm font-medium text-dark-text bg-dark-surface hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-light"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dark-purple-light hover:bg-dark-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </div>
      </form>
    {/if}

    <div class="text-center">
      <span class="text-sm text-dark-text">
        Already have an account?{' '}
        <a href="/auth/login" class="font-medium text-dark-purple-light hover:text-dark-purple">
          Sign in
        </a>
      </span>
    </div>
  </div>
</div>