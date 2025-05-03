<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-background text-gray-900 dark:text-white">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white dark:bg-dark-surface shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <UButton to="/dashboard" variant="ghost" class="p-1 mr-2">
              <UIcon name="i-heroicons-academic-cap" class="text-3xl text-primary-600 dark:text-primary-400" />
            </UButton>
            <h1 class="text-xl md:text-2xl font-bold">My Dashboard</h1>
          </div>

          <!-- Navigation and Theme Toggle -->
          <div class="flex items-center space-x-2">
            <nav class="hidden md:flex space-x-1">
              <UButton
                v-for="item in navItems"
                :key="item.id"
                :to="item.route"
                variant="ghost"
                class="px-3 py-1"
              >
                <UIcon :name="item.icon" class="mr-1" />
                {{ item.title }}
              </UButton>
            </nav>

            <!-- Theme Toggle -->
            <UButton
              icon="i-heroicons-sun"
              v-if="dashboardStore.theme === 'dark'"
              variant="ghost"
              @click="toggleTheme"
              aria-label="Toggle to light mode"
            />
            <UButton
              icon="i-heroicons-moon"
              v-else
              variant="ghost"
              @click="toggleTheme"
              aria-label="Toggle to dark mode"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Menu (only visible on small screens) -->
    <div class="md:hidden bg-white dark:bg-dark-surface shadow-sm">
      <div class="container mx-auto px-4 py-2">
        <div class="flex justify-between overflow-x-auto">
          <UButton
            v-for="item in navItems"
            :key="item.id"
            :to="item.route"
            variant="ghost"
            size="sm"
            class="whitespace-nowrap"
          >
            <UIcon :name="item.icon" class="mr-1" />
            {{ item.title }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-grow">
      <div class="container mx-auto p-4 md:p-6">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-dark-surface py-4 border-t border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>My Dashboard — Personal Teaching Tools</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useDashboardStore, type Card } from '~/stores/dashboard';
import { useColorMode } from '#imports';

// Access the dashboard store
const dashboardStore = useDashboardStore();

// Access Nuxt's color mode composable
const colorMode = useColorMode();

// Navigation items based on cards from the store
const navItems = computed<Card[]>(() => {
  return dashboardStore.getAllCards;
});

// Toggle between light and dark theme
const toggleTheme = () => {
  dashboardStore.toggleTheme();
  
  // Sync Nuxt color mode with our store
  colorMode.preference = dashboardStore.theme;
};

// Sync Nuxt color mode with our store theme on changes
watch(() => dashboardStore.theme, (newTheme) => {
  colorMode.preference = newTheme;
});

// On component mount, sync the color mode with our store's theme
onMounted(() => {
  // If the store has a saved theme, use it
  if (dashboardStore.theme) {
    colorMode.preference = dashboardStore.theme;
  } else {
    // Otherwise, sync the store with Nuxt's current preference
    dashboardStore.setTheme(colorMode.preference === 'dark' ? 'dark' : 'light');
  }
});
</script>

