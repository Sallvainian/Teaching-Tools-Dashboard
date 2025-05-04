<!-- ✅ File: pages/index.vue -->
<template>
  <section class="space-y-6">
    <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">Welcome to My Edu App</h1>

    <p class="text-gray-700 dark:text-gray-300 max-w-2xl">
      This is your all-in-one platform for managing lessons, tracking grades, and engaging your students.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink to="/dashboard" class="block p-4 bg-primary-500 text-white rounded-lg shadow hover:bg-primary-600 transition">
        <h2 class="text-lg font-semibold">Dashboard</h2>
        <p class="text-sm opacity-90">Overview of all tools</p>
      </NuxtLink>

      <NuxtLink to="/lesson-planner" class="block p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition">
        <h2 class="text-lg font-semibold">Lesson Planner</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">Create and manage lessons</p>
      </NuxtLink>

      <NuxtLink to="/gradebook" class="block p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition">
        <h2 class="text-lg font-semibold">Gradebook</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">Track student performance</p>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
// Home page logic if needed
</script>
