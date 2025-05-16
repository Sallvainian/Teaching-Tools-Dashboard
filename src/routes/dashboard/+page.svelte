<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { observationLogStore } from '$lib/stores/observation-log';
  
  // Get some stats
  const { categories } = gradebookStore;
  const { getGames } = jeopardyStore;
  
  let observationCount = 0;
  $: observationCount = observationLogStore.getLogs().length;
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Page header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-1">Teacher Dashboard</h1>
    <p class="text-dark-muted">Welcome back! Here's an overview of your teaching tools</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-dark-card border border-dark-border p-4 rounded-xl">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-dark-muted text-sm">Total Students</p>
          <h3 class="text-xl font-bold text-white">124</h3>
        </div>
        <div
          class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
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
      </div>
    </div>

    <div class="bg-dark-card border border-dark-border p-4 rounded-xl">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-dark-muted text-sm">Classes</p>
          <h3 class="text-xl font-bold text-white">{$categories.length}</h3>
        </div>
        <div
          class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
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
      </div>
    </div>

    <div class="bg-dark-card border border-dark-border p-4 rounded-xl">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-dark-muted text-sm">Games</p>
          <h3 class="text-xl font-bold text-white">{$getGames.length}</h3>
        </div>
        <div
          class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
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
      </div>
    </div>

    <div class="bg-dark-card border border-dark-border p-4 rounded-xl">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-dark-muted text-sm">Observations</p>
          <h3 class="text-xl font-bold text-white">{observationCount}</h3>
        </div>
        <div
          class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Quick Access Cards -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-white mb-6">Quick Access</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Gradebook Card -->
      <a href="/gradebook" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Gradebook</h3>
              <p class="text-sm text-dark-muted">{$categories.length} Classes</p>
            </div>
          </div>
          <p class="text-dark-muted">Track student grades and assignments</p>
        </div>
      </a>
      
      <!-- Jeopardy Card -->
      <a href="/jeopardy" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Jeopardy</h3>
              <p class="text-sm text-dark-muted">{$getGames.length} Games</p>
            </div>
          </div>
          <p class="text-dark-muted">Create and play educational quiz games</p>
        </div>
      </a>
      
      <!-- Behavior Logs Card -->
      <a href="/observation-log" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Behavior Logs</h3>
              <p class="text-sm text-dark-muted">{observationCount} Logs</p>
            </div>
          </div>
          <p class="text-dark-muted">Track student behavior and observations</p>
        </div>
      </a>
      
      <!-- Lesson Planner Card -->
      <a href="/lesson-planner" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Lesson Planner</h3>
              <p class="text-sm text-dark-muted">Organize</p>
            </div>
          </div>
          <p class="text-dark-muted">Plan and schedule your lessons</p>
        </div>
      </a>
      
      <!-- Class Dojo Card -->
      <a href="/class-dojo-remake" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Class Rewards</h3>
              <p class="text-sm text-dark-muted">Behavior</p>
            </div>
          </div>
          <p class="text-dark-muted">Reward and track student behavior</p>
        </div>
      </a>
      
      <!-- Settings Card -->
      <a href="/settings" class="block">
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl hover:shadow-dark-hover hover:border-dark-highlight transition-all duration-300">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 rounded-xl bg-dark-purple bg-opacity-20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-dark-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Settings</h3>
              <p class="text-sm text-dark-muted">Configure</p>
            </div>
          </div>
          <p class="text-dark-muted">Manage your preferences</p>
        </div>
      </a>
    </div>
  </div>
  
  <!-- Recent Activity -->
  <div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card">
    <h2 class="text-lg font-semibold text-white mb-4">Recent Activity</h2>
    <div class="space-y-4">
      <div class="flex items-start gap-4">
        <div
          class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
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
        </div>
        <div>
          <p class="text-white">
            Added a new assignment: <span class="text-dark-highlight">Midterm Exam</span>
          </p>
          <p class="text-xs text-dark-muted">Today, 10:42 AM</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div
          class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
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
          <p class="text-white">
            Created a new Jeopardy game: <span class="text-dark-highlight">Science Quiz</span>
          </p>
          <p class="text-xs text-dark-muted">Yesterday, 3:15 PM</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div
          class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <div>
          <p class="text-white">
            Added a new student: <span class="text-dark-highlight">Emily Johnson</span>
          </p>
          <p class="text-xs text-dark-muted">2 days ago, 11:30 AM</p>
        </div>
      </div>
    </div>
  </div>
</div>