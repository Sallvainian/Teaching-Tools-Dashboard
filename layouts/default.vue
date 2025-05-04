<!-- ✅ File: layouts/default.vue -->
<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-dark-background text-gray-900 dark:text-dark-text transition-colors">
    <header class="p-4 shadow border-b">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">📚 My Edu App</h1>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm underline text-primary-600 dark:text-primary-400 hover:text-primary-800">Home</NuxtLink>
          <DarkModeToggle />
        </div>
      </div>
    </header>

    <main class="flex-1 p-4">
      <slot />
    </main>

    <footer class="p-4 text-center text-sm text-gray-500 border-t">
      &copy; {{ new Date().getFullYear() }} My Edu App
    </footer>
  </div>
</template>

<script setup lang="ts">
// Using our custom DarkModeToggle component
</script>
