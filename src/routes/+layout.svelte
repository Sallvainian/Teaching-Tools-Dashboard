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
  import { goto } from '$app/navigation';
  import { gradebookStore } from '$lib/stores/gradebook';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import { navigating } from '$app/stores';
  import { authStore, isAuthenticated, user } from '$lib/stores/auth';

  // Props for the layout
  const { children } = $props();

  // Access the store
  const { getCategories, selectCategory, addCategory } = gradebookStore;

  let newClassName = $state('');
  let sidebarCollapsed = $state(false);
  let userMenuOpen = $state(false);

  function handleAddClass() {
    if (newClassName.trim()) {
      addCategory(newClassName);
      newClassName = '';
    }
  }

  function handleSelectClass(categoryId: string) {
    selectCategory(categoryId);
    goto('/gradebook');
  }

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }

  function handleSignOut() {
    authStore.signOut();
    goto('/auth/login');
  }

  // Set dark mode on mount
  onMount(() => {
    // Set dark mode
    document.documentElement.classList.add('dark');
    // Set AG Grid dark mode attribute
    document.documentElement.setAttribute('data-ag-theme-mode', 'dark');

    // Close user menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu')) {
        userMenuOpen = false;
      }
    }

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
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
          <a
            href="/observation-log"
            class="text-gray-300 hover:text-dark-highlight transition font-medium">Behavior Logs</a
          >
        </div>

        <div class="relative user-menu">
          {#if $isAuthenticated}
            <button 
              onclick={toggleUserMenu}
              class="flex items-center gap-3 hover:bg-dark-accent/20 p-1 rounded-lg"
            >
              <div
                class="w-8 h-8 bg-dark-purple rounded-full flex items-center justify-center text-white font-medium"
              >
                {$user?.user_metadata?.full_name?.[0] || $user?.email?.[0]?.toUpperCase() || 'T'}
              </div>
              <span class="text-sm text-gray-300">{$user?.user_metadata?.full_name || 'Teacher'}</span>
              <svg class="w-4 h-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {#if userMenuOpen}
              <div class="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-md shadow-lg z-50">
                <div class="py-1">
                  <a href="/settings/profile" class="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-accent hover:text-white">
                    Profile
                  </a>
                  <a href="/settings" class="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-accent hover:text-white">
                    Settings
                  </a>
                  <button 
                    onclick={handleSignOut}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-accent hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            {/if}
          {:else}
            <a href="/auth/login" class="text-gray-300 hover:text-dark-highlight transition font-medium">
              Sign in
            </a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <div class="flex flex-grow relative">
    <!-- Left sidebar - hidden on smaller screens -->
    <aside class="hidden md:block bg-dark-surface border-r border-dark-border transition-[width] duration-150 relative"
           class:collapsed={sidebarCollapsed}
           style="width: {sidebarCollapsed ? '3.5rem' : '14rem'}">
      <!-- Toggle button - Clean minimalist style -->
      <button 
        onclick={() => sidebarCollapsed = !sidebarCollapsed}
        class="absolute -right-3 top-6 z-10 w-6 h-6 bg-dark-surface border border-dark-border rounded-md text-dark-muted hover:text-dark-highlight hover:border-dark-highlight transition-all duration-200"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg class="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d={sidebarCollapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
        </svg>
      </button>
      
      <div class="space-y-6 transition-[padding] duration-150" class:p-4={!sidebarCollapsed} class:px-0={sidebarCollapsed} class:py-4={sidebarCollapsed}>
        <div>
          {#if !sidebarCollapsed}
            <h3 class="text-dark-muted uppercase text-xs font-semibold mb-3 px-3">Menu</h3>
          {/if}
          <div class="space-y-1">
            <a
              href="/dashboard"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Dashboard"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Dashboard</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Dashboard</span>
              {/if}
            </a>
            <a
              href="/classes"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Classes"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Classes</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Classes</span>
              {/if}
            </a>
            <a
              href="/gradebook"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Gradebook"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Gradebook</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Gradebook</span>
              {/if}
            </a>
            <a
              href="/jeopardy"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Jeopardy"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Jeopardy</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Jeopardy</span>
              {/if}
            </a>
            <a
              href="/lesson-planner"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Planner"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Planner</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Planner</span>
              {/if}
            </a>
            <a
              href="/class-dojo-remake"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Dojo"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
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
              {#if !sidebarCollapsed}
                <span>Dojo</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Dojo</span>
              {/if}
            </a>
            <a
              href="/observation-log"
              class="flex items-center gap-2 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white relative group transition-colors duration-100"
              class:px-3={!sidebarCollapsed}
              class:px-1={sidebarCollapsed}
              class:justify-center={sidebarCollapsed}
              title="Behavior Logs"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              {#if !sidebarCollapsed}
                <span>Behavior Logs</span>
              {:else}
                <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Behavior Logs</span>
              {/if}
            </a>
          </div>
        </div>

        {#if $isAuthenticated}
          <div>
            {#if !sidebarCollapsed}
              <h3 class="text-dark-muted uppercase text-xs font-semibold mb-3 px-3">Classes</h3>
            {/if}
            <div class="space-y-1">
              {#each $getCategories as category (category.id)}
                <button
                  onclick={() => handleSelectClass(category.id)}
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white text-left relative group"
                  title={category.name}
                >
                  {#if !sidebarCollapsed}
                    <span>{category.name}</span>
                    <span class="bg-dark-purple text-white text-xs rounded-full px-2 py-1"
                      >{category.studentIds.length}</span
                    >
                  {:else}
                    <span class="text-xs">{category.name.slice(0, 2).toUpperCase()}</span>
                    <span class="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {category.name} ({category.studentIds.length} students)
                    </span>
                  {/if}
                </button>
              {:else}
                {#if !sidebarCollapsed}
                  <p class="text-dark-muted text-sm px-3">No classes added yet</p>
                {/if}
              {/each}

              {#if !sidebarCollapsed}
                <div class="mt-3 pt-3 border-t border-dark-border">
                  <div class="flex items-center px-3 gap-2">
                    <input
                      type="text"
                      bind:value={newClassName}
                      placeholder="New class name"
                      class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                    />
                    <button
                      onclick={handleAddClass}
                      class="bg-dark-purple text-white p-2 rounded-lg text-sm"
                      aria-label="Add new class"
                    >
                      +
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </aside>

    <!-- Main content area -->
    <main class="flex-grow p-6 overflow-y-auto relative">
      {#if $navigating}
        <div class="absolute inset-0 bg-dark-bg bg-opacity-50 flex items-center justify-center z-50">
          <LoadingBounce />
        </div>
      {/if}
      {@render children?.()}
    </main>
  </div>

  <footer
    class="bg-dark-surface text-center text-dark-muted text-xs py-4 border-t border-dark-border px-6"
  >
    Teacher Dashboard • {new Date().getFullYear()}
  </footer>
</div>