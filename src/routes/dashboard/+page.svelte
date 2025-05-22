<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { logEntriesStore } from '$lib/stores/log-entries';
  
  // Store references
  const { games } = jeopardyStore;
  
  // Get some stats using Svelte 5 runes with null checks
  const logEntryCount = $derived($logEntriesStore.logs?.length ?? 0);
  const gameCount = $derived($games?.length ?? 0);
  const studentCount = $derived($gradebookStore.students?.length ?? 0);
  const categoryCount = $derived($gradebookStore.categories?.length ?? 0);
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Page header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-highlight mb-1">Teacher Dashboard</h1>
    <p class="text-text-base">Welcome back! Here's an overview of your teaching tools</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="card-dark">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
        </div>
        <div>
          <p class="text-gray-200 font-medium">Total Students</p>
          <p class="text-gray-400 text-sm">{studentCount} students enrolled</p>
        </div>
      </div>
    </div>

    <div class="card-dark">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Classes</p>
          <p class="text-gray-400 text-sm">{categoryCount} active classes</p>
        </div>
      </div>
    </div>

    <div class="card-dark">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
        </div>
        <div>
          <p class="text-gray-200 font-medium">Games</p>
          <p class="text-gray-400 text-sm">{gameCount} Jeopardy games</p>
        </div>
      </div>
    </div>

    <div class="card-dark">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <p class="text-gray-200 font-medium">Log Entries</p>
          <p class="text-gray-400 text-sm">{logEntryCount} student observations</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="mb-8">
    <h2 class="text-xl font-bold text-highlight mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <a
        href="/gradebook"
        class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Open Gradebook</p>
            <p class="text-gray-400 text-sm">Manage grades and assignments</p>
          </div>
        </div>
      </a>

      <a
        href="/jeopardy"
        class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Create Game</p>
            <p class="text-gray-400 text-sm">Make a Jeopardy quiz</p>
          </div>
        </div>
      </a>

      <a
        href="/lesson-planner"
        class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Plan Lesson</p>
            <p class="text-gray-400 text-sm">Create lesson plans</p>
          </div>
        </div>
      </a>

      <a
        href="/log-entries"
        class="card-dark hover:border-purple hover:shadow-glow transition-all duration-300"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple-light"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-gray-200 font-medium">Add Log Entry</p>
            <p class="text-gray-400 text-sm">Track student interactions</p>
          </div>
        </div>
      </a>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="card-dark p-6">
    <h2 class="text-xl font-bold text-highlight mb-4">Recent Activity</h2>
    <p class="text-text-base">No recent activity to display.</p>
  </div>
</div>