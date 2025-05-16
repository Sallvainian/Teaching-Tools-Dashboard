<script lang="ts">
  import { observationReasons } from '$lib/types/observation-log';
  import { uniqueStudentNames } from '$lib/stores/observation-log';
  import type { ObservationLogFilters, ObservationReason } from '$lib/types/observation-log';
  
  // Initialize filter state
  let filters: ObservationLogFilters = {
    studentName: '',
    startDate: '',
    endDate: '',
    reason: undefined,
    resolved: undefined
  };
  
  // Reference to student name input for autocomplete
  let studentNameInput: HTMLInputElement;
  let showStudentSuggestions = false;
  let filteredStudentNames: string[] = [];
  
  $: {
    // Update student name suggestions
    if (filters.studentName && filters.studentName.length > 0) {
      filteredStudentNames = $uniqueStudentNames.filter(name => 
        name.toLowerCase().includes(filters.studentName!.toLowerCase())
      );
      showStudentSuggestions = filteredStudentNames.length > 0;
    } else {
      showStudentSuggestions = false;
    }
  }
  
  function selectStudentName(name: string) {
    filters.studentName = name;
    showStudentSuggestions = false;
  }
  
  function handleClickOutside(event: MouseEvent) {
    if (studentNameInput && !studentNameInput.contains(event.target as Node)) {
      showStudentSuggestions = false;
    }
  }
  
  // Apply filters
  function applyFilters() {
    dispatch('filter', filters);
  }
  
  // Reset filters
  function resetFilters() {
    filters = {
      studentName: '',
      startDate: '',
      endDate: '',
      reason: undefined,
      resolved: undefined
    };
    dispatch('filter', filters);
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<svelte:window onclick={handleClickOutside} />

<div class="bg-dark-card rounded-lg p-6 shadow-dark-card mb-6 border border-dark-border">
  <h3 class="text-lg font-medium text-dark-highlight mb-4">Search & Filter Behavior Logs</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Student Name -->
    <div class="relative">
      <label for="studentName" class="block text-sm font-medium text-gray-300 mb-1">
        Student Name
      </label>
      <input
        type="text"
        id="studentName"
        bind:value={filters.studentName}
        bind:this={studentNameInput}
        onfocus={() => { if (filters.studentName) showStudentSuggestions = true; }}
        class="block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        placeholder="Search by student name"
      />
      
      <!-- Student name suggestions -->
      {#if showStudentSuggestions}
        <div class="absolute z-10 mt-1 w-full bg-dark-surface rounded-md shadow-dark-card max-h-60 overflow-auto border border-dark-border">
          <ul class="py-1">
            {#each filteredStudentNames as name}
              <li>
                <button
                  class="w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-accent cursor-pointer"
                  onclick={() => selectStudentName(name)}
                >
                  {name}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    
    <!-- Date Range -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="startDate" class="block text-sm font-medium text-gray-300 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          bind:value={filters.startDate}
          class="block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        />
      </div>
      <div>
        <label for="endDate" class="block text-sm font-medium text-gray-300 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          bind:value={filters.endDate}
          class="block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        />
      </div>
    </div>
    
    <!-- Reason -->
    <div>
      <label for="reason" class="block text-sm font-medium text-gray-300 mb-1">
        Reason
      </label>
      <select
        id="reason"
        bind:value={filters.reason}
        class="block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      >
        <option value={undefined}>All Reasons</option>
        {#each observationReasons as reason}
          <option value={reason}>{reason}</option>
        {/each}
      </select>
    </div>
    
    <!-- Resolved Status -->
    <div>
      <label for="resolved" class="block text-sm font-medium text-gray-300 mb-1">
        Status
      </label>
      <select
        id="resolved"
        bind:value={filters.resolved}
        class="block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      >
        <option value={undefined}>All Statuses</option>
        <option value={true}>Resolved</option>
        <option value={false}>Unresolved</option>
      </select>
    </div>
  </div>
  
  <!-- Action Buttons -->
  <div class="flex justify-end mt-4 space-x-3">
    <button
      type="button"
      onclick={resetFilters}
      class="px-4 py-2 bg-dark-accent text-white rounded-md hover:bg-dark-muted focus:outline-none focus:ring-2 focus:ring-dark-border"
    >
      Reset
    </button>
    <button
      type="button"
      onclick={applyFilters}
      class="px-4 py-2 bg-dark-purple text-white rounded-md hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-dark-highlight"
    >
      Apply Filters
    </button>
  </div>
</div>