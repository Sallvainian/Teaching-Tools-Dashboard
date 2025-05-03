<template>
  <DashboardLayout>
    <div>
      <div class="flex items-center mb-6">
        <UIcon name="i-heroicons-academic-cap" class="text-3xl text-primary-600 dark:text-primary-400 mr-3" />
        <h1 class="text-3xl font-bold">Gradebook</h1>
      </div>

      <div class="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
        <!-- Quick Actions Card -->
        <UCard class="lg:col-span-1">
          <template #header>
            <h2 class="text-xl font-semibold">Quick Actions</h2>
          </template>
          
          <div class="space-y-2">
            <UButton v-for="action in quickActions" :key="action.title" 
              :icon="action.icon" block class="justify-start">
              {{ action.title }}
            </UButton>
          </div>
        </UCard>

        <!-- Grade Statistics Card -->
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold">Class Statistics</h2>
              <UButton icon="i-heroicons-chart-bar" variant="ghost" color="gray">
                View Reports
              </UButton>
            </div>
          </template>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="stat in gradeStats" :key="stat.label" 
              class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <div class="text-2xl font-bold" :class="stat.color">{{ stat.value }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Grades Table -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Student Grades</h2>
            <div class="flex space-x-2">
              <UButton icon="i-heroicons-plus" color="primary" size="sm">
                Add Assignment
              </UButton>
              <UButton icon="i-heroicons-user-plus" variant="soft" size="sm">
                Add Student
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="!hasStudents" class="p-8 text-center text-gray-500 dark:text-gray-400">
          <UIcon name="i-heroicons-user-group" class="mx-auto mb-4 text-5xl opacity-20" />
          <p class="mb-2">No students added yet.</p>
          <UButton icon="i-heroicons-user-plus" size="sm">Add Your First Student</UButton>
        </div>

        <!-- Sample Table (when hasStudents is true) -->
        <div v-else>
          <UTable 
            :columns="tableColumns" 
            :rows="tableRows"
            :ui="{ 
              td: { 
                base: 'py-3 px-4 border-b border-gray-200 dark:border-gray-700' 
              }
            }"
          />
        </div>
      </UCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';
import { ref } from 'vue';

// Get the dashboard store
const dashboardStore = useDashboardStore();

// For demo purposes, showing empty state
const hasStudents = ref(false);

// Quick actions for the gradebook
const quickActions = [
  { title: 'Add New Assignment', icon: 'i-heroicons-document-plus' },
  { title: 'Import Grades', icon: 'i-heroicons-arrow-down-tray' },
  { title: 'Export to CSV', icon: 'i-heroicons-arrow-up-tray' },
  { title: 'Email Grade Reports', icon: 'i-heroicons-envelope' },
  { title: 'Grade Settings', icon: 'i-heroicons-cog-6-tooth' }
];

// Sample grade statistics
const gradeStats = [
  { label: 'Class Average', value: '78%', color: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Highest Grade', value: '96%', color: 'text-green-600 dark:text-green-400' },
  { label: 'Lowest Grade', value: '54%', color: 'text-red-600 dark:text-red-400' }
];

// Table configuration for the gradebook
const tableColumns = [
  { key: 'name', label: 'Student Name' },
  { key: 'id', label: 'ID' },
  { key: 'quiz1', label: 'Quiz 1' },
  { key: 'quiz2', label: 'Quiz 2' },
  { key: 'midterm', label: 'Midterm' },
  { key: 'final', label: 'Final' },
  { key: 'average', label: 'Average' }
];

// Sample student data
const tableRows = [
  // This is just for the structure, empty state is shown instead
];

// Update last used tool
onMounted(() => {
  dashboardStore.setLastUsedTool('gradebook');
});

// Set page metadata
useHead({
  title: 'Gradebook',
  meta: [
    { name: 'description', content: 'Track and manage student grades and progress' }
  ]
});
</script>

