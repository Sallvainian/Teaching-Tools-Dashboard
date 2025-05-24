<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { logEntriesStore } from '$lib/stores/log-entries';
  
  // Get some stats using Svelte 5 runes with null checks
  const logEntryCount = $derived(($logEntriesStore?.logs || []).length);
  const gameCount = $derived(($jeopardyStore?.games || []).length);
  const studentCount = $derived(($gradebookStore?.students || []).length);
  const categoryCount = $derived(($gradebookStore?.categories || []).length);
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Page header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-highlight mb-1">Welcome Back!</h1>
    <p class="text-text-base">Here's an overview of your teaching tools and recent activity</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-purple-bg flex items-center justify-center text-purple">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Students</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-purple">{studentCount}</span>
            <span class="text-sm text-gray-400">enrolled</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-purple-bg flex items-center justify-center text-purple">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Classes</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-purple">{categoryCount}</span>
            <span class="text-sm text-gray-400">active</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-purple-bg flex items-center justify-center text-purple">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Games</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-purple">{gameCount}</span>
            <span class="text-sm text-gray-400">created</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-purple-bg flex items-center justify-center text-purple">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Log Entries</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-purple">{logEntryCount}</span>
            <span class="text-sm text-gray-400">recorded</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="mb-8">
    <h2 class="text-xl font-bold text-highlight mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <a href="/gradebook" class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Gradebook</p>
            <p class="text-gray-400 text-sm">Manage grades</p>
          </div>
        </div>
      </a>

      <a href="/jeopardy" class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Jeopardy</p>
            <p class="text-gray-400 text-sm">Create a game</p>
          </div>
        </div>
      </a>

      <a href="/log-entries" class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Log Entry</p>
            <p class="text-gray-400 text-sm">Record observation</p>
          </div>
        </div>
      </a>

      <a href="/lesson-planner" class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Plan Lesson</p>
            <p class="text-gray-400 text-sm">Create schedule</p>
          </div>
        </div>
      </a>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Log Entries -->
    <div class="card-dark">
      <h2 class="text-xl font-bold text-highlight mb-4">Recent Log Entries</h2>
      {#if ($logEntriesStore?.logs || []).length > 0}
        <div class="space-y-3">
          {#each ($logEntriesStore?.logs || []).slice(0, 3) as log}
            <div class="p-3 bg-surface rounded-lg hover:bg-accent transition-colors">
              <div class="flex justify-between items-start mb-1">
                <span class="font-medium text-gray-200">{log.student}</span>
                <span class="text-sm text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
              </div>
              <p class="text-sm text-gray-400 line-clamp-2">{log.observation}</p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400 text-center py-4">No log entries yet</p>
      {/if}
    </div>

    <!-- Recent Games -->
    <div class="card-dark">
      <h2 class="text-xl font-bold text-highlight mb-4">Recent Games</h2>
      {#if ($jeopardyStore?.games || []).length > 0}
        <div class="space-y-3">
          {#each ($jeopardyStore?.games || []).slice(0, 3) as game}
            <div class="p-3 bg-surface rounded-lg hover:bg-accent transition-colors">
              <div class="flex justify-between items-start mb-1">
                <span class="font-medium text-gray-200">{game.name}</span>
                <span class="text-sm text-gray-400">{new Date(game.lastModified).toLocaleDateString()}</span>
              </div>
              <p class="text-sm text-gray-400">
                {game.categories.length} categories, {game.teams.length} teams
              </p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400 text-center py-4">No games created yet</p>
      {/if}
    </div>
  </div>
</div>