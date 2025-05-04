<template>
  <div class="flex items-center">
    <Switch
      v-model="isDarkMode"
      :class="[
        isDarkMode ? 'bg-primary-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      ]"
    >
      <span class="sr-only">Toggle dark mode</span>
      <span
        aria-hidden="true"
        :class="[
          isDarkMode ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        ]"
      />
    </Switch>
    <span v-if="showLabel" class="ml-3 text-sm hidden md:inline">
      {{ isDarkMode ? '🌙 Dark' : '🔆 Light' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Switch } from '@headlessui/vue'
import { computed } from 'vue'

const props = defineProps({
  showLabel: {
    type: Boolean,
    default: true
  }
})

// Use built-in color mode composable
const colorMode = useColorMode()

// Create a computed property for two-way binding with the Switch
const isDarkMode = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script>

