<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow-xl rounded-lg overflow-hidden dark:bg-gray-800">
        <div class="px-6 py-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
            HeadlessUI + Tailwind CSS Integration Test
          </h1>
          <p class="text-gray-600 mb-8 dark:text-gray-300">
            This page demonstrates that the HeadlessUI components are properly integrated with Tailwind CSS,
            including the @headlessui/tailwindcss plugin that enables the ui-* modifiers.
          </p>
          
          <div class="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-200">
              Menu Component Demo
            </h2>
            <p class="text-gray-600 mb-6 dark:text-gray-400">
              Click the button below to open a dropdown menu. This demonstrates the transition effects and
              interaction states using both standard Tailwind CSS classes and the ui-* variant modifiers.
            </p>
            
            <TestHeadlessUI />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import the TestHeadlessUI component (auto-imported by Nuxt)
</script>

