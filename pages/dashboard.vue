<!-- ✅ Final Directory: /pages/dashboard.vue -->
<template>
  <div class="max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-6">My Dashboard</h1>

    <!-- Dashboard sections -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Lesson Planner -->
      <div class="bg-white dark:bg-dark-surface rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold flex items-center">
            <span class="mr-2">📝</span> Lesson Planner
          </h2>
          <NuxtLink to="/lesson-planner" class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            Open
          </NuxtLink>
        </div>
        <p class="text-gray-600 dark:text-gray-300">Plan and organize your lessons</p>
      </div>

      <!-- Gradebook -->
      <div class="bg-white dark:bg-dark-surface rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold flex items-center">
            <span class="mr-2">📊</span> Gradebook
          </h2>
          <NuxtLink to="/gradebook" class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            Open
          </NuxtLink>
        </div>
        <p class="text-gray-600 dark:text-gray-300">Track student progress and grades</p>
      </div>

      <!-- ClassDojo Remake -->
      <div class="bg-white dark:bg-dark-surface rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold flex items-center">
            <span class="mr-2">🏆</span> ClassDojo Remake
          </h2>
          <NuxtLink to="/class-dojo-remake" class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            Open
          </NuxtLink>
        </div>
        <p class="text-gray-600 dark:text-gray-300">Manage student behavior and rewards</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// You can add any dashboard-specific logic here
</script>
