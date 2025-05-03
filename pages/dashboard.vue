<template>
  <DashboardLayout>
    <div>
      <h1 class="text-3xl font-bold mb-6">Welcome to Your Teaching Dashboard</h1>
      
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-8">
        Select a tool below to get started or continue working on your last used tool.
      </p>

      <!-- Last Used Tool Shortcut -->
      <div v-if="lastUsedCard" class="mb-8">
        <h2 class="text-xl font-medium mb-4">Continue where you left off:</h2>
        <div class="max-w-md">
          <dashboard-card-with-button
            :id="lastUsedCard.id"
            :title="lastUsedCard.title"
            :icon="lastUsedCard.icon"
            :route="lastUsedCard.route"
            :description="lastUsedCard.description"
            button-text="Continue"
            color="success"
          />
        </div>
      </div>

      <!-- All Tools Grid -->
      <div>
        <h2 class="text-xl font-medium mb-4">All Tools:</h2>
        <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <dashboard-card-with-button
            v-for="card in dashboardStore.getAllCards"
            :key="card.id"
            :id="card.id"
            :title="card.title"
            :icon="card.icon"
            :route="card.route"
            :description="card.description"
          />
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardStore, type Card } from '~/stores/dashboard';

// Get the dashboard store
const dashboardStore = useDashboardStore();

// Get the last used tool if available
const lastUsedCard = computed<Card | undefined>(() => {
  const lastUsedTool = dashboardStore.getLastUsedTool;
  
  if (lastUsedTool) {
    return dashboardStore.getCardById(lastUsedTool);
  }
  
  return undefined;
});

// Set page metadata
useHead({
  title: 'My Dashboard',
  meta: [
    { name: 'description', content: 'A personal dashboard for teaching tools' }
  ]
});
</script>

