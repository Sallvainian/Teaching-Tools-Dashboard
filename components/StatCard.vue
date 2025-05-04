<template>
  <div class="rounded-lg bg-white dark:bg-dark-surface shadow ring-1 ring-gray-900/5 p-6">
    <!-- Optional icon slot at top -->
    <div v-if="$slots.icon">
      <span class="inline-flex items-center justify-center rounded-md bg-primary-500/10 text-primary-600 p-2 shadow-md">
        <slot name="icon" />  <!-- e.g., an SVG icon or emoji -->
      </span>
    </div>
    <!-- Stat title -->
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ title }}
    </h3>
    <!-- Stat value or content -->
    <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-200">
      <slot name="value">{{ value }}</slot>
    </p>
    <!-- Optional description slot (e.g., "vs last week") -->
    <p v-if="$slots.desc" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      <slot name="desc" />
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
}
defineProps<Props>();
</script>
