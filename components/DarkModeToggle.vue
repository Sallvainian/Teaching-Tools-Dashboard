<template>
  <ClientOnly>
    <div class="flex items-center">
      <Switch
        v-model="isDarkMode"
        class="relative inline-flex h-6 w-11 items-center rounded-full ui-checked:bg-blue-600 ui-not-checked:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span class="sr-only">Toggle dark mode</span>
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition ui-checked:translate-x-6 ui-not-checked:translate-x-1 relative"
        >
          <!-- Sun icon (shown when light mode) -->
          <span v-if="!isDarkMode" class="absolute inset-0 flex items-center justify-center text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
          </span>
          <!-- Moon icon (shown when dark mode) -->
          <span v-else class="absolute inset-0 flex items-center justify-center text-blue-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </span>
        </span>
      </Switch>
      <span v-if="showLabel" class="ml-3 text-sm hidden md:inline">
        {{ isDarkMode ? '🌙 Dark' : '🔆 Light' }}
      </span>
    </div>
    
    <!-- Fallback content for server-side rendering -->
    <template #fallback>
      <div class="flex items-center">
        <div class="w-11 h-6 rounded-full bg-gray-200"></div>
        <span v-if="showLabel" class="ml-3 text-sm hidden md:inline">🔆 Light</span>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Switch } from '@headlessui/vue'
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  showLabel: {
    type: Boolean,
    default: true
  }
})

// Use built-in color mode composable
const colorMode = useColorMode()

// Create a ref to store the initial state
const darkModeState = ref(false)

// Initialize on client side
onMounted(() => {
  // Force value to match the preference
  darkModeState.value = colorMode.preference === 'dark'
})

// Create a computed property for two-way binding with the Switch
const isDarkMode = computed({
  get: () => darkModeState.value,
  set: (value) => {
    darkModeState.value = value
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script>

