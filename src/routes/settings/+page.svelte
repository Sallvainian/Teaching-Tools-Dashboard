<script lang="ts">
  import { onMount } from 'svelte';

  // Settings values - only has localStorage support now
  let darkMode = true;

  onMount(() => {
    // Load current settings for dark mode
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode !== null) {
      darkMode = JSON.parse(storedDarkMode);
    }
  });

  function handleToggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', JSON.stringify(darkMode));

    // Apply dark mode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set AG Grid theme mode
    document.documentElement.setAttribute('data-ag-theme-mode', darkMode ? 'dark' : 'light');
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold text-white mb-8">Settings</h1>

  <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mb-8">
    <h2 class="text-xl font-semibold text-white mb-4">Display Settings</h2>

    <div class="flex items-center mb-6">
      <span class="mr-4 text-gray-300">Dark Mode:</span>
      <div class="relative inline-block w-12 mr-2 align-middle select-none">
        <input
          type="checkbox"
          id="toggle-dark-mode"
          checked={darkMode}
          on:change={handleToggleDarkMode}
          class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
        />
        <label
          for="toggle-dark-mode"
          class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"
        ></label>
      </div>
      <span class="text-gray-300">{darkMode ? 'On' : 'Off'}</span>
    </div>

    <p class="text-dark-muted mb-6">
      Dark mode reduces eye strain in low-light environments and can help save battery on OLED
      displays.
    </p>
  </div>

  <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
    <h2 class="text-xl font-semibold text-white mb-4">Data Management</h2>

    <div class="space-y-4">
      <button
        on:click={() => {
          if (
            confirm('Are you sure you want to clear all localStorage data? This cannot be undone.')
          ) {
            localStorage.clear();
            window.location.reload();
          }
        }}
        class="py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Clear All Local Data
      </button>
    </div>

    <div class="mt-6 text-xs text-dark-muted">
      <p>
        Warning: Clearing local data will remove all data stored in your browser. This action cannot
        be undone.
      </p>
    </div>
  </div>

  <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mt-8">
    <h2 class="text-xl font-semibold text-white mb-4">About</h2>

    <p class="text-dark-muted mb-2">Teacher Dashboard v1.0.0</p>

    <p class="text-dark-muted mb-6">
      An all-in-one educational tool for teachers with gradebook, jeopardy, lesson planning, and
      classroom management features.
    </p>

    <div class="mt-6 text-xs text-dark-muted">
      <p>Current Storage: LocalStorage (Browser-based)</p>
      <p class="mt-1">
        Data is stored in your browser. It will persist until you clear browser data or use the
        clear data button above.
      </p>
    </div>
  </div>
</div>

<style>
  .toggle-checkbox:checked {
    right: 0;
    border-color: #8b5cf6;
  }
  .toggle-checkbox:checked + .toggle-label {
    background-color: #8b5cf6;
  }
  .toggle-checkbox:focus + .toggle-label {
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
  }
  .toggle-label {
    transition: background-color 0.2s;
  }
</style>
