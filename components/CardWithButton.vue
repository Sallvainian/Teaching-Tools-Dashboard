<template>
  <div 
    class="h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
  >
    <!-- card layout -->
    <div class="flex h-full flex-col gap-4 p-6">
      <!-- icon + title -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full
                 bg-primary-100 dark:bg-gray-700
                 text-primary-700 dark:text-primary-300"
        >
          <NuxtIcon :name="icon" class="text-2xl" />
        </div>

        <h3 class="text-xl font-semibold text-gray-800 dark:text-white">
          {{ title }}
        </h3>
      </div>

      <!-- description -->
      <p v-if="description" class="flex-grow text-gray-600 dark:text-gray-300">
        {{ description }}
      </p>

      <!-- action button -->
      <NuxtLink 
        :to="route" 
        class="w-full mt-auto text-center py-2 px-4 rounded-md bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
        @click="handleClick"
      >
        {{ buttonText }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  title: string
  description?: string
  icon?: string
  route: string
  buttonText?: string
  color?: string
  variant?: string
}

// Use defineProps with defaults
const props = withDefaults(defineProps<Props>(), {
  icon: 'heroicons:cube',  // Updated icon format
  buttonText: 'Open',
  color: 'primary',
  variant: 'solid'
})

const dashboardStore = useDashboardStore()
const handleClick = () => dashboardStore.setLastUsedTool(props.id)
</script>
