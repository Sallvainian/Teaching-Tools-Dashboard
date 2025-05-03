<template>
  <DashboardLayout>
    <div>
      <div class="flex items-center mb-6">
        <UIcon name="i-heroicons-trophy" class="text-3xl text-primary-600 dark:text-primary-400 mr-3" />
        <h1 class="text-3xl font-bold">ClassDojo Remake</h1>
      </div>

      <!-- Class Selector and Quick Stats -->
      <div class="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <USelect
          v-model="selectedClass"
          :options="classes"
          placeholder="Select a class"
          class="w-full sm:w-64"
        />
        
        <div class="flex gap-3">
          <UBadge color="green" variant="soft" size="lg" class="px-3">
            <template #default>
              <span class="font-semibold">{{ classStats.positive }}</span>&nbsp;Positive
            </template>
          </UBadge>
          <UBadge color="red" variant="soft" size="lg" class="px-3">
            <template #default>
              <span class="font-semibold">{{ classStats.negative }}</span>&nbsp;Needs Work
            </template>
          </UBadge>
        </div>
      </div>

      <!-- Behavior Actions and Student Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <!-- Behavior Management Panel -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">Behavior Management</h2>
            </template>

            <!-- Positive Behaviors -->
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Positive Behaviors</h3>
              <div class="space-y-2">
                <UButton v-for="behavior in positiveBehaviors" :key="behavior.id"
                  block color="green" variant="soft" class="justify-start">
                  <UIcon :name="behavior.icon" class="mr-2" />
                  {{ behavior.label }}
                </UButton>
              </div>
            </div>

            <!-- Needs Work Behaviors -->
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Needs Work</h3>
              <div class="space-y-2">
                <UButton v-for="behavior in negativeBehaviors" :key="behavior.id"
                  block color="red" variant="soft" class="justify-start">
                  <UIcon :name="behavior.icon" class="mr-2" />
                  {{ behavior.label }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Student Grid -->
        <div class="lg:col-span-3">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold">Students</h2>
                <UButton icon="i-heroicons-user-plus" size="sm">Add Student</UButton>
              </div>
            </template>

            <div v-if="!hasStudents" class="p-8 text-center text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-user-group" class="mx-auto mb-4 text-5xl opacity-20" />
              <p class="mb-2">No students added to this class yet.</p>
              <UButton icon="i-heroicons-user-plus" size="sm">Add Your First Student</UButton>
            </div>
            
            <!-- Student Grid (when hasStudents is true) -->
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <UCard v-for="student in demoStudents" :key="student.id" class="text-center">
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-2 flex items-center justify-center overflow-hidden">
                    <UIcon name="i-heroicons-user-circle" class="text-4xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="font-medium">{{ student.name }}</h3>
                  
                  <div class="flex justify-center gap-2 mt-2">
                    <UBadge color="green" class="px-2">+{{ student.positive }}</UBadge>
                    <UBadge color="red" class="px-2">-{{ student.negative }}</UBadge>
                  </div>
                </div>
              </UCard>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Rewards and Behavior Trends -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Rewards Panel -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold">Rewards</h2>
              <UButton icon="i-heroicons-gift" size="sm" color="primary">Create Reward</UButton>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCard v-for="reward in rewards" :key="reward.id" class="border border-gray-200 dark:border-gray-700">
              <div class="flex items-center">
                <UIcon :name="reward.icon" class="text-2xl mr-3 text-primary-500 dark:text-primary-400" />
                <div>
                  <h3 class="font-medium">{{ reward.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{{ reward.pointsCost }} points</p>
                </div>
              </div>
            </UCard>
          </div>
        </UCard>

        <!-- Behavior Trends -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Weekly Behavior Trends</h2>
          </template>

          <div class="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-center text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-chart-bar" class="text-4xl mx-auto mb-2" />
              <p>Behavior charts will appear here</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { ref } from 'vue';

// Get the dashboard store
const dashboardStore = useDashboardStore();

// For demo purposes, showing empty state option
const hasStudents = ref(true);

// Selected class
const selectedClass = ref('class-1');

// Available classes
const classes = [
  { value: 'class-1', label: 'Period 1 - Math' },
  { value: 'class-2', label: 'Period 2 - Science' },
  { value: 'class-3', label: 'Period 3 - English' },
  { value: 'class-4', label: 'Period 4 - History' },
];

// Class statistics
const classStats = {
  positive: 24,
  negative: 7,
};

// Positive behaviors
const positiveBehaviors = [
  { id: 'participating', label: 'Participating', icon: 'i-heroicons-hand-raised' },
  { id: 'helping', label: 'Helping Others', icon: 'i-heroicons-heart' },
  { id: 'on-task', label: 'On Task', icon: 'i-heroicons-check-circle' },
  { id: 'teamwork', label: 'Teamwork', icon: 'i-heroicons-user-group' },
];

// Negative behaviors
const negativeBehaviors = [
  { id: 'off-task', label: 'Off Task', icon: 'i-heroicons-x-circle' },
  { id: 'disrupting', label: 'Disrupting', icon: 'i-heroicons-exclamation-triangle' },
  { id: 'unprepared', label: 'Unprepared', icon: 'i-heroicons-briefcase' },
];

// Demo students
const demoStudents = [
  { id: 1, name: 'Alex Smith', positive: 8, negative: 2 },
  { id: 2, name: 'Jordan Lee', positive: 5, negative: 0 },
  { id: 3, name: 'Taylor Kim', positive: 6, negative: 1 },
  { id: 4, name: 'Sam Chen', positive: 5, negative: 4 },
];

// Sample rewards
const rewards = [
  { id: 1, name: 'Free Reading Time', pointsCost: 15, icon: 'i-heroicons-book-open' },
  { id: 2, name: 'Game Time', pointsCost: 20, icon: 'i-heroicons-puzzle-piece' },
  { id: 3, name: 'Homework Pass', pointsCost: 30, icon: 'i-heroicons-document-check' },
  { id: 4, name: 'Special Helper', pointsCost: 10, icon: 'i-heroicons-star' },
];

// Update last used tool
onMounted(() => {
  dashboardStore.setLastUsedTool('class-dojo-remake');
});

// Set page metadata
useHead({
  title: 'ClassDojo Remake',
  meta: [
    { name: 'description', content: 'Track student behavior and manage classroom rewards' }
  ]
});
</script>

