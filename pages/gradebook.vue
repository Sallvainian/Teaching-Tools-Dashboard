<!-- ✅ File: pages/gradebook.vue -->
<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400">Gradebook</h1>

    <div class="bg-white dark:bg-dark-surface rounded-lg shadow p-6">
      <p class="text-gray-700 dark:text-gray-300">
        This is where you can manage and view grades for each student.
      </p>

      <!-- Placeholder Table -->
      <div class="overflow-x-auto mt-6">
        <table class="min-w-full text-sm text-left border border-gray-200 dark:border-gray-700">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="p-3 font-semibold">Student</th>
              <th class="p-3 font-semibold">Math</th>
              <th class="p-3 font-semibold">Science</th>
              <th class="p-3 font-semibold">English</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-gray-200 dark:border-gray-700">
              <td class="p-3">John Doe</td>
              <td class="p-3">A</td>
              <td class="p-3">B+</td>
              <td class="p-3">A-</td>
            </tr>
            <tr class="border-t border-gray-200 dark:border-gray-700">
              <td class="p-3">Jane Smith</td>
              <td class="p-3">B</td>
              <td class="p-3">A</td>
              <td class="p-3">B+</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Gradebook logic (future enhancements go here)
</script>
