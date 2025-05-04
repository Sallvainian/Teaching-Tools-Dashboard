<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
    <header class="p-4 shadow border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">Nuxt + Headless UI + Tailwind CSS</h1>
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">Home</NuxtLink>
          <NuxtLink to="/test" class="text-sm underline text-blue-600 dark:text-blue-400 hover:text-blue-800">Headless UI Demo</NuxtLink>
          <DarkModeToggle />
        </div>
      </div>
    </header>

    <main class="flex-1 p-4 max-w-7xl mx-auto w-full">
      <slot />
    </main>

    <footer class="p-4 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
      &copy; {{ new Date().getFullYear() }} - Headless UI + Tailwind CSS Integration
    </footer>
  </div>
</template>

<script setup>
// Using our custom DarkModeToggle component
</script>
