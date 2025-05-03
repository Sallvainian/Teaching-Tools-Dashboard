<template>
  <div class="space-y-12 p-8 bg-gray-50 min-h-screen">
    <!-- Dashboard cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CardWithButton 
        v-for="card in dashboardCards" 
        :key="card.id"
        :id="card.id"
        :title="card.title"
        :icon="card.icon"
        :route="card.route"
        :description="card.description"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';

// Get dashboard cards from the store
const dashboardStore = useDashboardStore();
const dashboardCards = dashboardStore.getAllCards;
</script>
  