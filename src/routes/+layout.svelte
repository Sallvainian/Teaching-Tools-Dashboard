<script lang="ts">
  import '../app.css';
  // Only keep the font imports, no AG Grid CSS imports
  // Font that matches the system font stack
  import '@fontsource/inter/400.css';
  import '@fontsource/inter/500.css';
  import '@fontsource/inter/600.css';

  // Import AG Grid modules (registers modules globally)
  import '$lib/ag-grid-modules';
  // Import AG Grid CSS early - must come before any grid renders
  import '@ag-grid-community/styles/ag-grid.css';
  import '@ag-grid-community/styles/ag-theme-material.css';

  import { onMount } from 'svelte';
  import { gradebookStore } from '$lib/stores/gradebook';

  // Access the store
  const { getCategories, selectCategory, addCategory } = gradebookStore;

  let newClassName = '';

  function handleAddClass() {
    if (newClassName.trim()) {
      addCategory(newClassName);
      newClassName = '';
    }
  }

  function handleSelectClass(categoryId: string) {
    selectCategory(categoryId);
    window.location.href = '/gradebook';
  }

  // Set dark mode on mount
  onMount(() => {
    // Set dark mode
    document.documentElement.classList.add('dark');
    // Set AG Grid dark mode attribute
    document.documentElement.setAttribute('data-ag-theme-mode', 'dark');
  });
</script>

<div class="min-h-screen bg-dark-bg text-gray-100 flex flex-col transition-colors">
  <nav class="bg-dark-surface border-b border-dark-border">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 bg-dark-highlight rounded-md flex items-center justify-center">
          <span class="text-dark-purple font-bold text-lg">T</span>
        </div>
        <h1 class="text-xl font-bold tracking-wide text-white">
          Teacher <span class="text-dark-lavender">Dashboard</span>
        </h1>
      </div>

      <div class="flex items-center gap-8">
        <div class="flex gap-6">
          <a
            href="/dashboard"
            class="text-gray-300 hover:text-dark-highlight transition font-medium">Dashboard</a
          >
          <a
            href="/gradebook"
            class="text-gray-300 hover:text-dark-highlight transition font-medium">Gradebook</a
          >
          <a href="/jeopardy" class="text-gray-300 hover:text-dark-highlight transition font-medium"
            >Jeopardy</a
          >
          <a
            href="/lesson-planner"
            class="text-gray-300 hover:text-dark-highlight transition font-medium">Planner</a
          >
          <a
            href="/class-dojo-remake"
            class="text-gray-300 hover:text-dark-highlight transition font-medium">Dojo</a
          >
        </div>

        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-dark-purple rounded-full flex items-center justify-center text-white font-medium"
          >
            T
          </div>
          <span class="text-sm text-gray-300">Teacher</span>
        </div>
      </div>
    </div>
  </nav>

  <div class="flex flex-grow">
    <!-- Left sidebar - hidden on smaller screens -->
    <aside class="hidden md:block w-48 lg:w-56 bg-dark-surface border-r border-dark-border p-4">
      <div class="space-y-6">
        <div>
          <h3 class="text-dark-muted uppercase text-xs font-semibold mb-3 px-3">Menu</h3>
          <div class="space-y-1">
            <a
              href="/dashboard"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Dashboard</span>
            </a>
            <a
              href="/gradebook"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span>Gradebook</span>
            </a>
            <a
              href="/jeopardy"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Jeopardy</span>
            </a>
            <a
              href="/lesson-planner"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Planner</span>
            </a>
            <a
              href="/class-dojo-remake"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Dojo</span>
            </a>
          </div>
        </div>

        <div>
          <h3 class="text-dark-muted uppercase text-xs font-semibold mb-3 px-3">Classes</h3>
          <div class="space-y-1">
            {#each $getCategories as category (category.id)}
              <button
                on:click={() => handleSelectClass(category.id)}
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white text-left"
              >
                <span>{category.name}</span>
                <span class="bg-dark-purple text-white text-xs rounded-full px-2 py-1"
                  >{category.studentIds.length}</span
                >
              </button>
            {:else}
              <p class="text-dark-muted text-sm px-3">No classes added yet</p>
            {/each}

            <div class="mt-3 pt-3 border-t border-dark-border">
              <div class="flex items-center px-3 gap-2">
                <input
                  type="text"
                  bind:value={newClassName}
                  placeholder="New class name"
                  class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                />
                <button
                  on:click={handleAddClass}
                  class="bg-dark-purple text-white p-2 rounded-lg text-sm"
                  aria-label="Add new class"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content area -->
    <main class="flex-grow p-6 overflow-y-auto">
      <slot />
    </main>
  </div>

  <footer
    class="bg-dark-surface text-center text-dark-muted text-xs py-4 border-t border-dark-border px-6"
  >
    Teacher Dashboard • {new Date().getFullYear()}
  </footer>
</div>
