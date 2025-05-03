<template>
  <DashboardLayout>
    <div>
      <div class="flex items-center mb-6">
        <UIcon name="i-heroicons-clipboard-document-list" class="text-3xl text-primary-600 dark:text-primary-400 mr-3" />
        <h1 class="text-3xl font-bold">Lesson Planner</h1>
      </div>
      
      <UCard class="mb-6">
        <UAlert
          icon="i-heroicons-information-circle"
          color="info"
          variant="soft"
          title="Welcome to your Lesson Planner!"
          description="This tool helps you create, organize, and manage your lesson plans in one place."
          class="mb-4"
        />
        
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
          <UCard
            v-for="(item, index) in quickActionItems"
            :key="index"
            class="border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <UIcon :name="item.icon" class="text-2xl mr-3 text-primary-500 dark:text-primary-400" />
              <div>
                <h3 class="font-medium">{{ item.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ item.description }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </UCard>
      
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Your Lesson Plans</h2>
            <UButton icon="i-heroicons-plus" color="primary" size="sm">
              Create New
            </UButton>
          </div>
        </template>
        
        <div class="p-4 text-center text-gray-500 dark:text-gray-400 italic">
          <p>No lesson plans created yet. Click "Create New" to get started.</p>
        </div>
      </UCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';

// Get the dashboard store
const dashboardStore = useDashboardStore();

// Mock data for quick actions
const quickActionItems = [
  {
    title: 'Create Lesson Plan',
    description: 'Start a new lesson plan from scratch',
    icon: 'i-heroicons-document-plus'
  },
  {
    title: 'Import Template',
    description: 'Use a pre-made template for your lesson',
    icon: 'i-heroicons-document-duplicate'
  },
  {
    title: 'Weekly Schedule',
    description: 'View and manage your weekly schedule',
    icon: 'i-heroicons-calendar'
  },
  {
    title: 'Resource Library',
    description: 'Access your teaching resources',
    icon: 'i-heroicons-book-open'
  }
];

// Update last used tool
onMounted(() => {
  dashboardStore.setLastUsedTool('lesson-planner');
});

// Set page metadata
useHead({
  title: 'Lesson Planner',
  meta: [
    { name: 'description', content: 'Create and manage your teaching lesson plans' }
  ]
});
</script>

