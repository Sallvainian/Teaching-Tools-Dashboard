<script lang="ts">
  import type { LogEntryFilters } from '$lib/types/log-entries';
  import { logEntriesStore } from '$lib/stores/log-entries';
  
  const { onfilter } = $props<{
    onfilter?: (filters: LogEntryFilters) => void;
  }>();
  
  // Filter values using Svelte 5 state
  let searchQuery = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  let selectedStudent = $state('');
  let selectedTags = $state<string[]>([]);
  
  // Get unique values for dropdowns
  const students = logEntriesStore.getUniqueStudents();
  const availableTags = logEntriesStore.getUniqueTags();
  
  function applyFilters() {
    const filters: LogEntryFilters = {
      searchQuery: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      student: selectedStudent || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };
    
    onfilter?.(filters);
  }
  
  function clearFilters() {
    searchQuery = '';
    dateFrom = '';
    dateTo = '';
    selectedStudent = '';
    selectedTags = [];
    applyFilters();
  }
  
  // Apply filters on any change using Svelte 5 effect
  $effect(() => {
    applyFilters();
  });
</script>

<div class="bg-dark-card border border-dark-border rounded-xl p-4">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Search Input -->
    <div class="lg:col-span-2">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search entries..."
        class="w-full px-4 py-2 bg-dark-accent border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dark-purple"
      />
    </div>
    
    <!-- Clear Filters Button -->
    <div class="flex items-end">
      <button
        on:click={clearFilters}
        class="w-full px-4 py-2 bg-dark-accent text-gray-300 rounded-lg hover:bg-dark-accent-hover hover:text-white transition-colors"
      >
        Clear Filters
      </button>
    </div>
    
    <!-- Date Range -->
    <div>
      <label for="dateFrom" class="block text-sm font-medium text-dark-muted mb-1">From Date</label>
      <input
        id="dateFrom"
        type="date"
        bind:value={dateFrom}
        class="w-full px-4 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      />
    </div>
    
    <div>
      <label for="dateTo" class="block text-sm font-medium text-dark-muted mb-1">To Date</label>
      <input
        id="dateTo"
        type="date"
        bind:value={dateTo}
        class="w-full px-4 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      />
    </div>
    
    <!-- Student Filter -->
    <div>
      <label for="studentFilter" class="block text-sm font-medium text-dark-muted mb-1">Student</label>
      <select
        id="studentFilter"
        bind:value={selectedStudent}
        class="w-full px-4 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      >
        <option value="">All Students</option>
        {#each students as student}
          <option value={student}>{student}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- Tags Filter -->
  {#if availableTags.length > 0}
    <div class="mt-4">
      <label for="tagsFilter" class="block text-sm font-medium text-dark-muted mb-2">Tags</label>
      <div class="flex flex-wrap gap-2" id="tagsFilter">
        {#each availableTags as tag}
          <label class="inline-flex items-center">
            <input
              type="checkbox"
              bind:group={selectedTags}
              value={tag}
              class="mr-2 rounded border-dark-border text-dark-purple focus:ring-dark-purple"
            />
            <span class="text-sm text-gray-300">{tag}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
</div>