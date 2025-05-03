<template>
  <UCard 
    :ui="{ ring: '', body: { base: 'p-4' } }" 
    class="h-full hover:shadow-lg transition-shadow duration-300"
  >
    <div class="flex flex-col h-full">
      <div class="flex items-center mb-4">
        <div 
          class="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-dark-surface text-primary-700 dark:text-primary-300 mr-3"
        >
          <UIcon :name="icon" class="text-2xl" />
        </div>
        <h3 class="text-xl font-semibold text-gray-800 dark:text-white">{{ title }}</h3>
      </div>
      
      <p v-if="description" class="text-gray-600 dark:text-gray-300 mb-4 flex-grow">{{ description }}</p>
      
      <div class="mt-auto pt-4">
        <UButton
          :to="route"
          :color="color"
          :variant="variant"
          block
          @click="handleClick"
        >
          {{ buttonText || 'Open' }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';

// Props definition with TypeScript
interface Props {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  route: string;
  buttonText?: string;
  color?: string;
  variant?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-cube',
  buttonText: 'Open',
  color: 'primary',
  variant: 'solid',
});

// Get the dashboard store
const dashboardStore = useDashboardStore();

// Update last used tool when clicked
const handleClick = () => {
  dashboardStore.setLastUsedTool(props.id);
};
</script>

